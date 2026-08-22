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
  assert.match(html, /<title>AdMind — Explainable AI decisions for less disruptive video ads<\/title>/i);
  assert.match(html, /<html lang="en">/i);
  assert.match(html, /data-locale="en"/i);
  assert.match(html, /aria-label="Language \/ 语言"/i);
  assert.match(html, /广告必须出现/);
  assert.match(html, /game-ad-clean\.png\?v=v0\.4\.0/);
  assert.match(html, /广告已展示，任务已完成/);
  assert.match(html, /传统投放/);
  assert.match(html, /01 · 剧情高点/);
  assert.match(html, /02 · 用户暂停/);
  assert.match(html, /暂停后，系统判断是否展示广告/);
  assert.match(html, /简单角色画面/);
  assert.match(html, /传统暂停广告：立即全屏覆盖/);
  assert.match(html, /03 · 伦理边界/);
  assert.match(html, /正在加载视频/);
  assert.match(html, /救援、医疗与灾后内容始终优先保护/);
  assert.match(html, /海上救援/);
  assert.match(html, /医疗转运/);
  assert.doesNotMatch(html, /FEMA Hurricane Maria Recovery/);
  assert.match(html, /一段视频，如何变成/);
  assert.match(html, /视频理解 API/);
  assert.match(html, /系统同时看三类信息/);
  assert.match(html, /内容信号/);
  assert.match(html, /交互信号/);
  assert.match(html, /约束信号/);
  assert.match(html, /TwelveLabs API/);
  assert.match(html, /React \+ TypeScript/);
  assert.match(html, /href="\/regression"/);
  assert.match(html, /S2 视觉回归实验室/);
  assert.doesNotMatch(html, /180 CPM/);
  assert.doesNotMatch(html, />BLOCK</);
  assert.doesNotMatch(html, /决策后台/);
  assert.doesNotMatch(html, /搜索决策/);
  assert.doesNotMatch(html, /雷霆大页游/);
  assert.doesNotMatch(html, />CHARGE<\/strong>/);
  assert.doesNotMatch(html, />Coffee Run<\/strong>/);
  assert.doesNotMatch(html, />Llamigos<\/strong>/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("legacy decision-console route redirects into the decision-method view", async () => {
  const response = await render("/console");
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/#decision");
});

test("server-renders the bilingual S2 regression lab", async () => {
  const response = await render("/regression");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /S2 Vision Regression Lab/);
  assert.match(html, /Language \/ 语言/);
  assert.match(html, /Run fixed set/);
  assert.match(html, /charge-002/);
  assert.match(html, /charge-019/);
  assert.match(html, /Priority review 13/);
  assert.match(html, /not human ground truth/);
  assert.match(html, /not TwelveLabs/);
  assert.match(html, /MediaPipe model output/);
});
