/* Full conversion of your original routes list into a reusable route-row renderer. */

const DEFAULT_BASE_URL = "http://andre:3019";

const ROUTE_SECTIONS = [
  {
    title: "NTT Routes",
    routes: [
      { method: "GET", path: "/ntt/recordings" },
      { method: "GET", path: "/ntt/recordings/year/:year" },
      { method: "GET", path: "/ntt/recordings/:id" },
      { method: "GET", path: "/ntt/recordings/episode/:episode" },
      { method: "GET", path: "/ntt/regions/episode/:episode" },
      { method: "GET", path: "/ntt/regions/recording/:recordingId" },
      { method: "GET", path: "/ntt/topcalls" },
      { method: "GET", path: "/ntt/regions" },
      { method: "GET", path: "/ntt/regions/:id" },
      { method: "GET", path: "/ntt/regions/recording/:id" },
      { method: "GET", path: "/ntt/recording/regions/year/:year" },
      { method: "GET", path: "/ntt/recording/regions/year/:year/:desc" },
      { method: "GET", path: "/ntt/recording/region/:id/audiofile" },
      { method: "GET", path: "/ntt/recording/region/:id/notes" },
      { method: "POST", path: "/ntt/recording/region/note" },
    ],
  },

  {
    title: "Youtube Routes",
    routes: [
      { method: "GET", path: "/youtube/channel/name/:channelName" },
      { method: "GET", path: "/youtube/channels" },
      { method: "GET", path: "/youtube/channels/favorites" },
      { method: "GET", path: "/youtube/channel/owner/videos/:objid" },
      { method: "GET", path: "/youtube/channel/videos" },
      { method: "GET", path: "/youtube/channel/channelid/:id" },
      { method: "GET", path: "/youtube/videoid/:videoid" },
      { method: "GET", path: "/youtube/date/:date" },
      { method: "GET", path: "/youtube/video/caption" },
      { method: "GET", path: "/youtube/channel/dbid/:id" },
      { method: "GET", path: "/youtube/dbid/:objid" },
      { method: "POST", path: "/youtube/viewcompleted/:id" },
      { method: "GET", path: "/youtube/channel/videos/:name" },
      { method: "POST", path: "/youtube/channel/add" },
      { method: "POST", path: "/youtube/video/add" },
      { method: "POST", path: "/youtube/googleapi/" },
    ],
  },

  {
    title: "Law Texts",
    routes: [
      { method: "GET", path: "/texts/equity" },
      { method: "GET", path: "/texts/equity/available" },
      { method: "GET", path: "/texts/equity/book/:id" },
      { method: "GET", path: "/texts/equity/toc/id/:id" },
      { method: "GET", path: "/texts/equity/toc/author/:author" },
      { method: "GET", path: "/texts/equity/level/:level/:id" },
      { method: "GET", path: "/texts/equity/level2/:id" },
      { method: "GET", path: "/texts/equity/level3/:id" },
      { method: "GET", path: "/texts/equity/level4/:id" },
      { method: "GET", path: "/texts/equity/level5/:id" },
      { method: "GET", path: "/texts/equity/level6/:id" },

      { method: "GET", path: "/chancery/texts/equity/id//:id/toc" },
      { method: "GET", path: "/chancery/texts/equity/level8/:id" },
      { method: "GET", path: "/chancery/texts/equity/level9/:id" },
      { method: "GET", path: "/chancery/texts/equity/level10/:id" },
      { method: "GET", path: "/chancery/texts/equity/level11/:id" },
      { method: "GET", path: "/chancery/texts/equity/level12/:id" },
      { method: "GET", path: "/chancery/texts/equity/level13/:id" },

      { method: "GET", path: "/texts/equity/full/:id" },
      { method: "GET", path: "/texts/equity/v8/full/:id" },
    ],
  },

  {
    title: "Terms and Phrases Routes",
    routes: [
      { method: "GET", path: "/law/termsphrases/definition/term/:term" },
      { method: "GET", path: "/law/termsphrases/search" },
      { method: "POST", path: "/law/termsphrases/add" },
      { method: "POST", path: "/law/termsphrases/definition" },
      { method: "GET", path: "/law/termsphrases/definition/id/:id" },
      { method: "GET", path: "/law/termsphrases/undefined" },
      { method: "GET", path: "/law/termsphrases/definition/sources" },
      { method: "PUT", path: "/law/termsphrases/definition/:id" },
    ],
  },

  {
    title: "Podcasts Routes",
    routes: [
      { method: "GET", path: "/podcasts/spotify/all" },
      { method: "GET", path: "/podcasts/spotify/episodes/:showId/list" },
      { method: "GET", path: "/podcasts/spotify/search/:showId/:term" },
      { method: "GET", path: "/podcasts/apple/all" },
    ],
  },

  {
    title: "Library Routes",
    routes: [
      { method: "GET", path: "/library/paper" },
      { method: "POST", path: "/library/paper" },
      { method: "GET", path: "/library/:id" },
      { method: "GET", path: "/library/:isbn" },
    ],
  },

  {
    title: "Training Routes",
    routes: [
      { method: "POST", path: "/training/stats/weight" },
      { method: "GET", path: "/training/stats/weightlog" },
    ],
  },

  {
    title: "Torrent Routes",
    routes: [
      { method: "POST", path: "/torrents/add" },
      { method: "GET", path: "/torrents/search/:name" },
      { method: "GET", path: "/torrents/listbydate" },
      { method: "GET", path: "/torrents/listbyid/:id" },
      { method: "GET", path: "/torrents/status/:status" },
    ],
  },

  {
    title: "Gaming Routes",
    routes: [
      { method: "GET", path: "/aliens/users" },
      { method: "POST", path: "/aliens/users" },
      { method: "POST", path: "/aliens/login" },
    ],
  },

  {
    title: "Food Routes",
    routes: [
      { method: "POST", path: "/food/personal/inventory" },
      { method: "GET", path: "/food/personal/inventory" },
      { method: "GET", path: "/food/personal/description/:term" },
      { method: "GET", path: "/food/personal/bydate" },
      { method: "GET", path: "/food/personal/last" },
      { method: "POST", path: "/food/test" },
      { method: "GET", path: "/food/search" },
    ],
  },

  {
    title: "Finances Routes",
    routes: [
      { method: "GET", path: "/finances/expenditures" },
    ],
  },

  {
    title: "Government Routes",
    routes: [
      { method: "GET", path: "/gov/fed/jurisdictions" },
      { method: "GET", path: "/gov/fed/:abbr/flag" },
      { method: "GET", path: "/gov/fed/congress/:no" },
      { method: "GET", path: "/gov/fed/congress" },
      { method: "GET", path: "/govt/people" },
    ],
  },
];

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
  if (m === "GET") return `curl -s "${url}"`;
  return `curl -s -X ${m} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
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

async function loadIntoFrame(url) {
  const frame = document.getElementById("apiFrame");
  const jsonViewer = document.getElementById("jsonViewer");
  const label = document.getElementById("viewerUrl");

  if (!frame) return;

  if (label) label.textContent = url;

  try {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {

      const data = await res.json();
      jsonViewer.innerHTML = "";
      jsonViewer.appendChild(renderJsonTree(data));
      jsonViewer.classList.remove("hidden");
      frame.classList.add("hidden");
      frame.src = ""; // clear iframe

    } else {
      // fallback to iframe
      jsonViewer.classList.add("hidden");
      frame.classList.remove("hidden");
      frame.src = url;
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

function setJsonTreeExpanded(expanded) {
  const root = document.getElementById("jsonViewer");
  if (!root) return;
  if (!root || root.classList.contains("hidden")) return;
  root.querySelectorAll("details.json-details").forEach((d) => (d.open = expanded));
  // const nodes = root.querySelectorAll("details.json-details");
  // nodes.forEach((d) => {
  //   d.open = expanded;
  // });
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
    loadIntoFrame(url);
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

function renderApp(baseUrl) {
  const app = $("#app");
  if (!app) return;
  app.innerHTML = "";

  ROUTE_SECTIONS.forEach((section) => {
    const s = document.createElement("section");
    s.className = "section";

    const h = document.createElement("h2");
    h.className = "section__title";
    h.textContent = section.title;

    const list = document.createElement("div");
    list.className = "routes";

    section.routes.forEach((r) => list.appendChild(renderRouteRow(r, baseUrl)));

    s.appendChild(h);
    s.appendChild(list);
    app.appendChild(s);
  });
}

function normalizeBaseUrl(v) {
  const s = String(v || "").trim();
  if (!s) return DEFAULT_BASE_URL;
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

document.addEventListener("DOMContentLoaded", () => {
  const baseInput = $("#baseUrl");
  const applyBtn = $("#applyBase");
  const copyBaseBtn = $("#copyBase");

  const refreshBtn = document.getElementById("refreshFrame");
  const clearBtn = document.getElementById("clearFrame");

  const expandAllBtn = document.getElementById("expandAll");
  const collapseAllBtn = document.getElementById("collapseAll");
  const expandDepthInput = document.getElementById("expandDepth");
  const expandToDepthBtn = document.getElementById("expandToDepth");


  expandAllBtn?.addEventListener("click", () => setJsonTreeExpanded(true));
  collapseAllBtn?.addEventListener("click", () => setJsonTreeExpanded(false));
  expandToDepthBtn?.addEventListener("click", () => {
    const n = Number.parseInt(expandDepthInput?.value ?? "0", 10);
    expandJsonTreeToDepth(n);
  });

  // QoL: pressing Enter in the depth box triggers Expand
  expandDepthInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const n = Number.parseInt(expandDepthInput.value ?? "0", 10);
      expandJsonTreeToDepth(n);
    }
  });


  const initial = normalizeBaseUrl(baseInput?.value || DEFAULT_BASE_URL);
  if (baseInput) baseInput.value = initial;

  renderApp(initial);

  applyBtn?.addEventListener("click", () => {
    const next = normalizeBaseUrl(baseInput?.value);
    if (baseInput) baseInput.value = next;
    renderApp(next);
    showToast("Base URL applied.");
  });

  copyBaseBtn?.addEventListener("click", async () => {
    const next = normalizeBaseUrl(baseInput?.value);
    await copyText(next);
  });

  baseInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const next = normalizeBaseUrl(baseInput.value);
      baseInput.value = next;
      renderApp(next);
      showToast("Base URL applied.");
    }
  });

  refreshBtn?.addEventListener("click", () => {
    refreshFrame();
  });

  clearBtn?.addEventListener("click", () => {
    clearFrame();
  });
});
