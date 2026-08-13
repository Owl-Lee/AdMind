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

test("server-renders separate showcase and decision-method views", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>AdMind — 广告必须出现，也不必毁掉剧情<\/title>/i);
  assert.match(html, /广告必须出现/);
  assert.match(html, /传统投放/);
  assert.match(html, /高潮插播 · 内容连续性/);
  assert.match(html, /暂停状态 · 任务保护/);
  assert.match(html, /伦理场景 · 硬规则保护/);
  assert.match(html, /一段视频，如何变成/);
  assert.match(html, /视频理解 API/);
  assert.match(html, /系统同时看三类信息/);
  assert.match(html, /内容信号/);
  assert.match(html, /交互信号/);
  assert.match(html, /约束信号/);
  assert.match(html, /TwelveLabs API/);
  assert.match(html, /React \+ TypeScript/);
  assert.doesNotMatch(html, /180 CPM/);
  assert.doesNotMatch(html, />BLOCK</);
  assert.doesNotMatch(html, /决策后台/);
  assert.doesNotMatch(html, /搜索决策/);
  assert.doesNotMatch(html, /雷霆大页游/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("legacy decision-console route redirects into the decision-method view", async () => {
  const response = await render("/console");
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/#decision");
});
