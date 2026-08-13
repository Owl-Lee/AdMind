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
  assert.match(html, /高潮插播 · 内容理解/);
  assert.match(html, /暂停状态 · 交互保护/);
  assert.match(html, /保留用户的查看任务/);
  assert.match(html, /敏感场景 · 硬规则保护/);
  assert.match(html, /有些边界，价格不能越过/);
  assert.doesNotMatch(html, /AI 负责看懂/);
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
  assert.match(html, /一条广告决策/);
  assert.match(html, /从视频到可执行计划/);
  assert.match(html, /AI 看到了什么/);
  assert.match(html, /我们如何得到最终结果/);
  assert.match(html, /TwelveLabs/);
  assert.match(html, /两次运行，共识稳定/);
  assert.match(html, /完整计划校验/);
  assert.match(html, /确定性排序/);
  assert.match(html, /MODEL_CONSENSUS_BLOCK/);
  assert.match(html, /01:25/);
  assert.match(html, /三类场景，逐步扩充真实片段/);
  assert.doesNotMatch(html, /搜索决策/);
  assert.doesNotMatch(html, /Product demo/);
});
