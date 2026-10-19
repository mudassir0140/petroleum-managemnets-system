# Offline tests (browser and database)

These tests run against a built production app, a local MongoDB and Microsoft Edge.

Setup (once):
- `npm run build` in the repository.
- A MongoDB server listening on `MONGO_URI` (default `mongodb://127.0.0.1:27018`).
- Install `playwright-core` and `esbuild` in a folder outside the repository, and set
  `E2E_NODE_MODULES` to that folder's `node_modules`.
- Set `EDGE_PATH` if Edge is not in the default location.

Run:
- `node verify-db.cjs` (needs the app running with `MONGODB_URI` set and `BASE_URL` pointing at it): duplicate checks against MongoDB.
- `node outbox-test.cjs`: the offline queue against a stub API.
- `node sw-test.cjs` (needs the app running on `BASE_URL`): service worker and offline pages.
- `node browser-flows.cjs`: logged-in flows, starting its own app server on port 3140 and its own database `pms_browser`.
