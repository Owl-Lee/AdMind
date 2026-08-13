import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the AdMind decision console", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>AdMind — 广告必须出现，也不必毁掉剧情<\/title>/i);
  assert.match(html, /广告必须出现/);
  assert.match(html, /传统投放/);
  assert.match(html, /AdMind/);
  assert.match(html, /01:22/);
  assert.match(html, /决策后台/);
  assert.doesNotMatch(html, /搜索决策/);
  assert.doesNotMatch(html, /雷霆大页游/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("server-renders the detailed decision console separately", async () => {
  const response = await render("/console");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>决策后台 — AdMind<\/title>/i);
  assert.match(html, /内容情境与投放窗口/);
  assert.match(html, /为什么这样投/);
  assert.doesNotMatch(html, /搜索决策/);
  assert.doesNotMatch(html, /Product demo/);
});
