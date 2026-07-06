import assert from "node:assert/strict";
import test from "node:test";
import { app } from "../src/app.js";

let server;
let base;
test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test("health and catalog endpoints respond", async () => {
  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  assert.equal(health.status, "ok");
  const catalog = await fetch(`${base}/api/titles?search=orbit`).then((r) => r.json());
  assert.equal(catalog.titles[0].id, "orbit-fall");
});

test("library state can be updated", async () => {
  const response = await fetch(`${base}/api/profiles/demo/library/orbit-fall`, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ inWatchlist: true, progress: 42 })
  });
  assert.deepEqual(await response.json(), { profileId: "demo", titleId: "orbit-fall", inWatchlist: true, progress: 42 });
});
