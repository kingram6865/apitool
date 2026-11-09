This is a web app for an internal API.

## `js/routes.json`

routes.json is the route catalog that the browser tool loads to build its route list. It contains 16 sections and 107 routes.

Each section has a display title and a routes array. Each route has a method—such as GET, POST, or PATCH—and a path. Paths keep parameters like :id and :year so the browser can provide values when a route needs them.

The top-level schemaVersion: 1 identifies the manifest format. In the main.js code you shared, the browser checks that version and that sections is an array before rendering the routes. That keeps the route data outside the JavaScript, so the catalog can be generated or updated independently.

The browser expects the file at js/routes.json, matching ROUTE_MANIFEST_URL. The manifest includes GET /auth/me under Authentication Routes.
