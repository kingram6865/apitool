const DEFAULT_BASE_URL = "http://andre:3019";
// Load the generated manifest served by Apache at api/js/routes.json.
const ROUTE_MANIFEST_URL = "js/routes.json";

// Keep the API key in sessionStorage for this tab session.
const API_KEY_STORAGE_KEY = "apiBrowserApiKey:v1";

// This is populated from routes.json
let ROUTE_SECTIONS = [];

// Authentication and authenticated response-viewer state.
let apiKey = "";
let authRequestId = 0;
let activeFrameObjectUrl = null;
let lastRequest = null;

async function loadRouteSections() {
  const response = await fetch(
    `${ROUTE_MANIFEST_URL}?_=${Date.now()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Could not load routes: HTTP ${response.status}`);
  }

  const manifest = await response.json();

  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.sections)) {
    throw new Error("The route manifest has an unexpected format.");
  }

  return manifest.sections;
}

// Attach the verified API key to API requests.
function getApiRequestHeaders(extraHeaders = {}) {
  const headers = new Headers(extraHeaders);

  if (apiKey) {
    headers.set("x-api-key", apiKey);
  }

  return headers;
}

// Update the verification status and role shown in the page.
function setAuthenticationDisplay(status, role = "—", state = "") {
  const statusEl = document.getElementById("authStatus");
  const roleEl = document.getElementById("authRole");

  if (statusEl) {
    statusEl.textContent = status;
    statusEl.classList.remove("auth__status--ok", "auth__status--error");

    if (state === "ok") statusEl.classList.add("auth__status--ok");
    if (state === "error") statusEl.classList.add("auth__status--error");
  }

  if (roleEl) {
    roleEl.textContent = `Role: ${role}`;
  }
}

// Remove the saved API key, if sessionStorage is available.
function clearStoredApiKey() {
  try {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // Continue with in-memory state if session storage is unavailable.
  }
}

// Remove the curl preview so it cannot keep showing an obsolete key.
function clearCurlPreview() {
  const container = document.getElementById("curlPreviewContainer");
  const preview = document.getElementById("curlPreview");

  container?.classList.add("hidden");
  if (preview) preview.textContent = "";
}

// Clear the verified key from memory, sessionStorage, and the input.
function clearAuthentication(status = "API key cleared") {
  authRequestId += 1;
  apiKey = "";
  clearStoredApiKey();
  clearCurlPreview();

  const keyInput = document.getElementById("apiKey");
  if (keyInput) keyInput.value = "";

  setAuthenticationDisplay(status);
}

// Verify the key against the API's GET /auth/me endpoint.
async function verifyApiKey(candidate, baseUrl) {
  const key = String(candidate || "");
  const requestId = ++authRequestId;

  if (!key.trim()) {
    clearAuthentication("Enter an API key to verify.");
    return false;
  }

  setAuthenticationDisplay("Verifying API key…");

  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { "x-api-key": key },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = response.status === 401
        ? "API key was rejected."
        : `Verification failed: HTTP ${response.status}`;
      throw new Error(message);
    }

    const user = await response.json();

    // Ignore an older verification response if a newer one was started.
    if (requestId !== authRequestId) return false;

    if (!user || typeof user.role !== "string" || !user.role) {
      throw new Error("The API did not return a user role.");
    }

    apiKey = key;

    try {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch {
      // The key remains available in memory for this page session.
    }

    setAuthenticationDisplay("API key verified", user.role, "ok");

    // Refresh an existing curl preview so it includes the verified key.
    if (lastRequest) {
      updateCurlPreview(lastRequest.method, lastRequest.url);
    }

    return true;
  } catch (error) {
    if (requestId !== authRequestId) return false;

    apiKey = "";
    clearStoredApiKey();
    clearCurlPreview();
    setAuthenticationDisplay(error.message, "—", "error");
    return false;
  }
}

// Quote values safely in the generated shell command.
function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

// Release temporary object URLs used to display authenticated non-JSON responses.
function releaseFrameObjectUrl() {
  if (activeFrameObjectUrl) {
    URL.revokeObjectURL(activeFrameObjectUrl);
    activeFrameObjectUrl = null;
  }
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function showToast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => el.classList.remove("show"), 900);
}

function extractParams(path) {
  const matches = path.match(/:([A-Za-z0-9_]+)/g) || [];
  return matches.map((m) => m.slice(1));
}

function resolveUrl(baseUrl, path, routeRow) {
  let out = path;
  const params = extractParams(path);

  for (const p of params) {
    const input = routeRow.querySelector(`[data-param="${p}"]`);
    const raw = (input?.value ?? "").trim();
    if (!raw) return null;
    out = out.replace(`:${p}`, encodeURIComponent(raw));
  }
  return `${baseUrl}${out}`;
}

function buildCurl(method, url) {
  const m = String(method || "GET").toUpperCase();

  const lines = [];

  lines.push(`curl \\`);
  lines.push(`  -X ${m} \\`);

  // Include the API key header only after successful verification.
  if (apiKey) {
    lines.push(`  -H ${shellQuote(`x-api-key: ${apiKey}`)} \\`);
  }

  if (m !== "GET") {
    lines.splice(2, 0, `  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '{}'`);
  }

  return lines.join("\n");
}

function updateCurlPreview(method, url) {
  const container = document.getElementById("curlPreviewContainer");
  const pre = document.getElementById("curlPreview");

  if (!container || !pre) return;

  container.classList.remove("hidden");
  pre.textContent = buildCurl(method, url);
}


async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied.");
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
    showToast("Copied.");
  }
}

async function loadIntoFrame(url, method = "GET") {
  const frame = document.getElementById("apiFrame");
  const jsonViewer = document.getElementById("jsonViewer");
  const label = document.getElementById("viewerUrl");

  if (!frame) return;

  if (label) label.textContent = url;

  // Remember the request for Refresh and curl-preview updates.
  lastRequest = { url, method };
  releaseFrameObjectUrl();

  try {
    const start = performance.now();

    // Fetch the route with the verified API key header.
    const res = await fetch(url, { headers: getApiRequestHeaders() });

    // Clear the saved key and role if the API rejects the request.
    if (res.status === 401) {
      clearAuthentication("API key rejected or expired.");
    }
    const end = performance.now();
    const contentType = res.headers.get("content-type") || "";
    const elapsed = Math.round(end - start);
    updateResponseMeta(res, elapsed, method);


    if (contentType.includes("json")) {
      const responseText = await res.text();
      // const data = await res.json();
      try {
        const data = JSON.parse(responseText);
        jsonViewer.innerHTML = "";
        jsonViewer.appendChild(renderJsonTree(data));
      } catch {
        // Show the response text if JSON parsing fails.
        jsonViewer.textContent = responseText;
      }

      jsonViewer.classList.remove("hidden");
      frame.classList.add("hidden");
      frame.src = "about:blank"; // Use about:blank to clear the iframe.
    } else {
      // fallback to iframe
      // Display this authenticated fetch's body in the iframe.
      // The iframe's own request would not include the API key header.
      const responseBody = await res.blob();
      activeFrameObjectUrl = URL.createObjectURL(responseBody);
      jsonViewer.classList.add("hidden");
      frame.classList.remove("hidden");
      frame.src = activeFrameObjectUrl;
    }
  } catch (err) {
    if (jsonViewer) {
      jsonViewer.classList.remove("hidden");
      jsonViewer.textContent = "Error loading response:\n\n" + err.message;
    }
    frame.classList.add("hidden");
  }
}

function renderJsonTree(value) {
  const root = document.createElement("div");
  root.className = "json-tree";
  root.appendChild(renderJsonNode("(root)", value, 0));
  return root;
}

function renderJsonNode(key, value, depth) {
  const isObj = value !== null && typeof value === "object";
  const isArr = Array.isArray(value);

  if (!isObj) {
    const leaf = document.createElement("div");
    leaf.className = "json-leaf";
    leaf.innerHTML = `${formatKey(key)}: ${formatPrimitive(value)}`;
    return leaf;
  }

  const details = document.createElement("details");
  details.className = "json-details";

  // Default: open top-level; collapse deeper
  if (depth < 1) details.open = true;

  const summary = document.createElement("summary");
  summary.className = "json-summary";

  const count = isArr ? value.length : Object.keys(value).length;
  const typeLabel = isArr ? `Array(${count})` : `Object(${count})`;

  summary.innerHTML = `${formatKey(key)}: <span class="json-meta">${typeLabel}</span>`;
  details.appendChild(summary);

  const container = document.createElement("div");
  container.className = "json-node";

  if (isArr) {
    for (let i = 0; i < value.length; i++) {
      container.appendChild(renderJsonNode(String(i), value[i], depth + 1));
    }
  } else {
    const keys = Object.keys(value);
    for (const k of keys) {
      container.appendChild(renderJsonNode(k, value[k], depth + 1));
    }
  }

  details.appendChild(container);
  return details;
}

function formatKey(k) {
  // root label special-case
  if (k === "(root)") return `<span class="json-key">${k}</span>`;
  // numeric array indices look nicer without quotes
  if (/^\d+$/.test(k)) return `<span class="json-key">${k}</span>`;
  return `<span class="json-key">"${escapeHtml(k)}"</span>`;
}

function formatPrimitive(v) {
  if (v === null) return `<span class="json-null">null</span>`;

  const t = typeof v;
  if (t === "string") return `<span class="json-string">"${escapeHtml(v)}"</span>`;
  if (t === "number") return `<span class="json-number">${String(v)}</span>`;
  if (t === "boolean") return `<span class="json-boolean">${String(v)}</span>`;

  // undefined / bigint / symbol (rare in JSON), but keep safe
  return `<span>${escapeHtml(String(v))}</span>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setJsonTreeExpanded(expanded) {
  const root = document.getElementById("jsonViewer");
  if (!root || root.classList.contains("hidden")) return;

  root.querySelectorAll("details.json-details").forEach((d) => {
    d.open = expanded;
  });
}

function expandJsonTreeToDepth(maxDepth) {
  const root = document.getElementById("jsonViewer");
  if (!root || root.classList.contains("hidden")) return;

  // Clamp + normalize
  const n = Number.isFinite(maxDepth) ? maxDepth : 0;
  const depth = Math.max(0, Math.min(50, Math.floor(n)));

  // Root "(root)" node lives at depth 0 in our renderer.
  // We’ll open nodes with depth < maxDepth, and close nodes >= maxDepth.
  root.querySelectorAll("details.json-details").forEach((details) => {
    const nodeDepth = getDetailsDepth(details);
    details.open = nodeDepth < depth;
  });
}

function getDetailsDepth(detailsEl) {
  // Count how many ancestor <details.json-details> elements it has
  let d = 0;
  let cur = detailsEl.parentElement;
  while (cur) {
    if (cur.tagName === "DETAILS" && cur.classList.contains("json-details")) d += 1;
    cur = cur.parentElement;
  }
  return d;
}

function syntaxHighlight(json) {
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\b\d+(\.\d+)?\b)/g,
    function (match) {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function clearFrame() {
  const frame = document.getElementById("apiFrame");
  const label = document.getElementById("viewerUrl");
  if (frame) frame.src = "";
  if (label) label.textContent = "No request loaded";
}

function refreshFrame() {
  const frame = document.getElementById("apiFrame");
  if (!frame?.src) return;
  frame.src = frame.src;
}

function renderRouteRow({ method, path }, baseUrl) {
  const row = document.createElement("div");
  row.className = "route";

  const left = document.createElement("div");
  left.className = "route__left";

  const label = document.createElement("div");
  label.className = "route__label";

  const METHOD_UP = String(method).toUpperCase();

  const methodEl = document.createElement("span");
  methodEl.className = "route__method";
  methodEl.textContent = `[${METHOD_UP}]`;

  const pathEl = document.createElement("span");
  pathEl.className = "route__path";
  pathEl.textContent = path;

  label.appendChild(methodEl);
  label.appendChild(pathEl);

  const urlPreview = document.createElement("div");
  urlPreview.className = "route__url";

  const a = document.createElement("a");
  a.href = "#";
  a.textContent = `${baseUrl}${path}`;

  urlPreview.appendChild(a);

  left.appendChild(label);
  left.appendChild(urlPreview);

  const right = document.createElement("div");
  right.className = "route__right";

  const params = extractParams(path);

  function getResolvedOrToast() {
    const url = params.length ? resolveUrl(baseUrl, path, row) : `${baseUrl}${path}`;
    if (params.length && !url) {
      showToast("Missing parameter(s).");
      return null;
    }
    return url;
  }

  function openInViewerIfAllowed() {
    if (METHOD_UP !== "GET") {
      showToast("Open is GET-only for the iframe.");
      return;
    }
    const url = getResolvedOrToast();
    if (!url) return;
    loadIntoFrame(url, METHOD_UP);
  }

  // Param inputs
  params.forEach((p) => {
    const input = document.createElement("input");
    input.className = "param";
    input.setAttribute("data-param", p);
    input.placeholder = p;

    if (p === "year" || p === "id" || p === "objid" || p === "no" || p === "episode") {
      input.inputMode = "numeric";
    }

    // ✅ QoL: Enter loads this route into the iframe (GET only)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const url = getResolvedOrToast();
        if (!url) return;
        updateCurlPreview(METHOD_UP, url);
        openInViewerIfAllowed();
      }
    });

    right.appendChild(input);
  });

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "btn";
  openBtn.textContent = "Open";

  const copyUrlBtn = document.createElement("button");
  copyUrlBtn.type = "button";
  copyUrlBtn.className = "btn";
  copyUrlBtn.textContent = "Copy URL";

  const copyCurlBtn = document.createElement("button");
  copyCurlBtn.type = "button";
  copyCurlBtn.className = "btn";
  copyCurlBtn.textContent = "Copy curl";

  if (METHOD_UP !== "GET") {
    openBtn.disabled = true;
  }

  // URL preview click loads iframe (GET only)
  a.addEventListener("click", (e) => {
    e.preventDefault();
    openInViewerIfAllowed();
  });

  // Open button loads iframe (GET only)
  openBtn.addEventListener("click", () => {
    const url = getResolvedOrToast();
    if (!url) return;

    updateCurlPreview(METHOD_UP, url);
    openInViewerIfAllowed();
  });

  copyUrlBtn.addEventListener("click", async () => {
    const url = getResolvedOrToast();
    if (!url) return;
    await copyText(url);
  });

  copyCurlBtn.addEventListener("click", async () => {
    const url = getResolvedOrToast();
    if (!url) return;
    await copyText(buildCurl(METHOD_UP, url));
  });

  right.appendChild(openBtn);
  right.appendChild(copyUrlBtn);
  right.appendChild(copyCurlBtn);

  row.appendChild(left);
  row.appendChild(right);

  return row;
}

// The route groups now come from the fetched route manifest.
const ROUTE_GROUP_STATE_KEY = "routeGroupState:v1";

function setAllRouteGroupsOpen(isOpen) {
  const state = loadRouteGroupState();

  ROUTE_SECTIONS.forEach((section) => {
    state[section.title] = isOpen;
  });

  saveRouteGroupState(state);

  // Update current DOM if already rendered
  document.querySelectorAll("details.section").forEach((d) => {
    d.open = isOpen;
  });
}

function loadRouteGroupState() {
  try {
    const raw = localStorage.getItem(ROUTE_GROUP_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRouteGroupState(state) {
  try {
    localStorage.setItem(ROUTE_GROUP_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}


function renderApp(baseUrl) {
  const app = $("#app");
  if (!app) return;
  app.innerHTML = "";

  const state = loadRouteGroupState();

  ROUTE_SECTIONS.forEach((section) => {
    const details = document.createElement("details");
    details.className = "section";

    // Default open unless previously saved
    details.open = state[section.title] ?? true;
    details.addEventListener("toggle", () => {
      const next = loadRouteGroupState();
      next[section.title] = details.open;
      saveRouteGroupState(next);
    });

    const summary = document.createElement("summary");
    summary.className = "section__title";
    const count = section.routes.length;
    const order = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
    const counts = section.routes.reduce((acc, r) => {
    const m = String(r.method || "GET").toUpperCase();
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

    const pillsHtml = [
      ...order.filter((m) => counts[m]),
      ...Object.keys(counts).filter((m) => !order.includes(m)).sort(),
    ]
      .map((m) => `<span class="section__pill section__pill--${m.toLowerCase()}">${m} ${counts[m]}</span>`)
      .join("");

    summary.innerHTML = `
      <span class="section__label">${section.title}</span>
      <span class="section__count-badge">${count}</span>
      <span class="section__methods">${pillsHtml}</span>
    `;

    const list = document.createElement("div");
    list.className = "routes";
    section.routes.forEach((r) => list.appendChild(renderRouteRow(r, baseUrl)));

    details.appendChild(summary);
    details.appendChild(list);
    app.appendChild(details);
  });
}

function normalizeBaseUrl(v) {
  const s = String(v || "").trim();
  if (!s) return DEFAULT_BASE_URL;
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === "dark" || theme === "light") {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  } else {
    // "system" / unset
    root.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  }

  updateThemeButton();
}

function classifyLatency(ms) {
  if (!Number.isFinite(ms)) return "ok";
  if (ms < 100) return "fast";     // <100ms green
  if (ms < 300) return "ok";       // 100–299ms yellow
  if (ms < 1000) return "slow";    // 300–999ms orange
  return "vslow";                  // >=1000ms red
}

function getCurrentTheme() {
  // If user explicitly set one, use it
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark" || explicit === "light") return explicit;

  // Otherwise infer from system
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function updateThemeButton() {
  const btn = document.getElementById("toggleTheme");
  if (!btn) return;

  const theme = getCurrentTheme();
  // Button label indicates what you’ll switch TO
  btn.textContent = theme === "dark" ? "Light" : "Dark";
}

function updateResponseMeta(res, elapsedMs, method) {
  const metaBar = document.getElementById("responseMeta");
  const statusEl = document.getElementById("metaStatus");
  const timeEl = document.getElementById("metaTime");
  const typeEl = document.getElementById("metaType");
  const sizeEl = document.getElementById("metaSize");
  const headersPre = document.getElementById("responseHeaders");
  const methodEl = document.getElementById("metaMethod");


  if (!metaBar) return;
  metaBar.classList.remove("hidden");

  // ✅ Define status (avoids TDZ / ReferenceError)
  const status = res.status;
  const statusText = res.statusText;

  // ✅ Strip highlight based on status
  metaBar.classList.remove("ok", "warn", "err");
  if (status >= 200 && status < 300) {
    metaBar.classList.add("ok");
  } else if (status < 400) {
    metaBar.classList.add("warn");
  } else {
    metaBar.classList.add("err");
  }

  // ✅ Method badge formatting
  if (methodEl) {
    const m = String(method || "GET").toUpperCase();
    methodEl.textContent = m;

    methodEl.className = "meta__method";
    const normalized = m.toLowerCase();
    if (["get", "post", "put", "delete", "patch"].includes(normalized)) {
      methodEl.classList.add(normalized);
    } else {
      methodEl.classList.add("other");
    }
  }

  // ✅ Status text formatting
  if (statusEl) {
    statusEl.textContent = `${status} ${statusText}`;
    statusEl.className = "meta__status";
    if (status >= 200 && status < 300) statusEl.classList.add("ok");
    else if (status < 400) statusEl.classList.add("warn");
    else statusEl.classList.add("err");
  }

  // ✅ Time + latency grading
  if (timeEl) {
    timeEl.textContent = `${elapsedMs} ms`;
    timeEl.className = "meta__time " + classifyLatency(elapsedMs);
  }

  // ✅ Content-Type
  if (typeEl) {
    const type = res.headers.get("content-type") || "-";
    typeEl.textContent = type.split(";")[0];
  }

  // ✅ Size (if content-length provided)
  if (sizeEl) {
  const len = res.headers.get("content-length");
  sizeEl.textContent = len ? `${Number(len).toLocaleString()} bytes` : "";
  }

  // ✅ Headers Render
  if (headersPre) {
    const headers = [];
    res.headers.forEach((value, key) => {
      headers.push(`${key}: ${value}`);
    });
    headersPre.textContent = headers.join("\n");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const baseInput = $("#baseUrl");
  const applyBtn = $("#applyBase");
  const copyBaseBtn = $("#copyBase");

  const authForm = $("#authForm");
  const apiKeyInput = $("#apiKey");
  const clearApiKeyBtn = $("#clearApiKey");

  const refreshBtn = document.getElementById("refreshFrame");
  const clearBtn = document.getElementById("clearFrame");

  const expandAllBtn = document.getElementById("expandAll");
  const collapseAllBtn = document.getElementById("collapseAll");
  const expandDepthInput = document.getElementById("expandDepth");
  const expandToDepthBtn = document.getElementById("expandToDepth");
  const toggleHeadersBtn = document.getElementById("toggleHeaders");
  const headersPre = document.getElementById("responseHeaders");
  const copyCurlPreviewBtn = document.getElementById("copyCurlPreview");
  const toggleThemeBtn = document.getElementById("toggleTheme");
  const expandGroupsBtn = document.getElementById("expandGroups");
  const collapseGroupsBtn = document.getElementById("collapseGroups");

  expandAllBtn?.addEventListener("click", () => setJsonTreeExpanded(true));
  collapseAllBtn?.addEventListener("click", () => setJsonTreeExpanded(false));
  expandToDepthBtn?.addEventListener("click", () => {
    const n = Number.parseInt(expandDepthInput?.value ?? "0", 10);
    expandJsonTreeToDepth(n);
  });

  toggleHeadersBtn?.addEventListener("click", () => {
    headersPre?.classList.toggle("hidden");
  });

  copyCurlPreviewBtn?.addEventListener("click", async () => {
    const pre = document.getElementById("curlPreview");
    if (!pre) return;
    await copyText(pre.textContent);
  });

  expandGroupsBtn?.addEventListener("click", () => setAllRouteGroupsOpen(true));
  collapseGroupsBtn?.addEventListener("click", () => setAllRouteGroupsOpen(false));

  // QoL: pressing Enter in the depth box triggers Expand
  expandDepthInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const n = Number.parseInt(expandDepthInput.value ?? "0", 10);
      expandJsonTreeToDepth(n);
    }
  });

  // Load persisted theme (if any)
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
  updateThemeButton();

  toggleThemeBtn?.addEventListener("click", () => {
    const current = getCurrentTheme();
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // If user is in "system" mode (no explicit data-theme), update button on system change
  window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener("change", () => {
    if (!document.documentElement.hasAttribute("data-theme")) {
      updateThemeButton();
    }
  });

  const initial = normalizeBaseUrl(baseInput?.value || DEFAULT_BASE_URL);
  if (baseInput) baseInput.value = initial;

  // Load route groups from js/routes.json before rendering.
  try {
    ROUTE_SECTIONS = await loadRouteSections();
    renderApp(initial);
  } catch (error) {
    const app = $("#app");
    if (app) app.textContent = error.message;
  }

  // Restore the key for this tab and revalidate it with /auth/me.
  let savedApiKey = "";
  try {
    savedApiKey = sessionStorage.getItem(API_KEY_STORAGE_KEY) || "";
  } catch {
    // Session storage may be disabled; the user can still enter a key manually.
  }

  if (apiKeyInput && savedApiKey) {
    apiKeyInput.value = savedApiKey;
    void verifyApiKey(savedApiKey, initial);
  }

  authForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const baseUrl = normalizeBaseUrl(baseInput?.value || DEFAULT_BASE_URL);
    void verifyApiKey(apiKeyInput?.value, baseUrl);
  });


  // // Verify the entered key when the button is clicked.
  // verifyApiKeyBtn?.addEventListener("click", () => {
  //   const baseUrl = normalizeBaseUrl(baseInput?.value || DEFAULT_BASE_URL);
  //   void verifyApiKey(apiKeyInput?.value, baseUrl);
  // });

  // // Enter in the key field also triggers verification.
  // apiKeyInput?.addEventListener("keydown", (event) => {
  //   if (event.key === "Enter") {
  //     event.preventDefault();
  //     const baseUrl = normalizeBaseUrl(baseInput?.value || DEFAULT_BASE_URL);
  //     void verifyApiKey(apiKeyInput.value, baseUrl);
  //   }
  // });

  // Typing a different key invalidates the previous verification.
  apiKeyInput?.addEventListener("input", () => {
    if (apiKeyInput.value === apiKey) return;

    authRequestId += 1;
    apiKey = "";
    clearStoredApiKey();
    clearCurlPreview();
    setAuthenticationDisplay(
      apiKeyInput.value ? "Key changed; verify it." : "No API key verified"
    );
  });

  // Clear the current key and role display.
  clearApiKeyBtn?.addEventListener("click", () => {
    clearAuthentication();
  });

  const applyBaseUrl = async () => {
    const previouslyVerifiedKey = apiKey;
    const next = normalizeBaseUrl(baseInput?.value);
    if (baseInput) baseInput.value = next;
    renderApp(next);
    showToast("Base URL applied.");

    // Revalidate the key against the newly selected API base URL.
    if (previouslyVerifiedKey) {
      await verifyApiKey(previouslyVerifiedKey, next);
    }
  };

  applyBtn?.addEventListener("click", applyBaseUrl);

  copyBaseBtn?.addEventListener("click", async () => {
    const next = normalizeBaseUrl(baseInput?.value);
    await copyText(next);
  });

  baseInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      void applyBaseUrl();
    }
  });

  refreshBtn?.addEventListener("click", () => {
    refreshFrame();
  });

  clearBtn?.addEventListener("click", () => {
    clearFrame();
  });
});
