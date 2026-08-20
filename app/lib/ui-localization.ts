export type UiLocale = "en" | "zh";

const REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["视频理解负责识别救援、医疗或灾后语境；伦理硬规则负责最终阻止投放，竞价不能覆盖这条边界。", "Video understanding identifies rescue, medical, and disaster contexts; ethical hard rules make the final block, and bidding cannot override that boundary."],
  ["模型先判断原定点的内容张力，再在合同允许的延后范围中寻找恢复、转场或片尾窗口。", "The model evaluates tension at the original break, then searches the allowed deferral range for recovery, transition, or end-card windows."],
  ["AdMind 理解内容与用户动作，在商业约束下决定广告何时出现、以什么形式出现，以及何时不该出现。", "AdMind understands content and user actions, deciding when ads appear, how they appear, and when they should not."],
  ["现成的视频理解 API 负责看懂内容；AdMind 负责把内容信号、播放器事件与商业边界组合成可执行方案。", "A video-understanding API interprets the content; AdMind combines content signals, player events, and commercial boundaries into an executable plan."],
  ["不是让一个模型包办所有决定，而是把不同来源的信号放进同一套决策流程。", "One model does not own every decision; signals from different sources enter the same decision process."],
  ["系统没有因为“到了固定时间”就插广告，而是先确认当时处于战斗高潮，再寻找剧情恢复后的窗口。", "The system does not insert an ad just because a fixed time arrived. It first confirms the battle climax, then searches for a recovery window."],
  ["视频文件、广告时长、最晚投放时间和展示形式。", "Video file, ad duration, latest delivery time, and display format."],
  ["识别动作、情绪、人物状态、镜头变化和自然转场。", "Identify action, emotion, character state, shot changes, and natural transitions."],
  ["先守住体验与伦理边界，再在可用窗口中完成商业目标。", "Protect experience and ethical boundaries first, then pursue commercial goals within eligible windows."],
  ["什么时候出现、用什么形式、持续多久，或者本次不投放。", "When to appear, which format to use, how long to run, or whether to block this delivery."],
  ["由 TwelveLabs 分析剧情张力、动作、情绪、人物状态和转场位置。", "TwelveLabs analyzes narrative tension, action, emotion, character state, and transition points."],
  ["只读取当前播放器中的暂停、拖动、恢复播放和页面可见性。", "Read only pause, seeking, resume, and page visibility from the current player."],
  ["伦理保护优先；随后再检查广告时长、最晚时间和商业任务。", "Ethical protection comes first; ad duration, deadline, and campaign goals are checked afterward."],
  ["负责视频播放、方案切换和交互事件采集。", "Handles video playback, strategy switching, and interaction events."],
  ["上传视频并返回按时间组织的内容理解结果。", "Uploads video and returns time-coded content understanding."],
  ["把 AI 结果转换成候选窗口，再按边界逐项筛选。", "Turns AI evidence into candidate windows, then filters them against explicit boundaries."],
  ["比较多次 API 结果，并检查最终计划是否完整可执行。", "Compares repeated API results and verifies that the final plan is complete and executable."],
  ["暂停后，系统判断是否展示广告，并避开用户正在查看的主体内容。", "After a pause, the system decides whether to show an ad and avoids the subject the viewer is inspecting."],
  ["救援、医疗与灾后内容始终优先保护，系统不插入广告。", "Rescue, medical, and disaster content remains protected; the system does not insert an ad."],
  ["比较固定插播与 AdMind 的低打断投放。", "Compare fixed insertion with AdMind's lower-disruption delivery."],
  ["正在确认稳定暂停；恢复播放、拖动或离开页面都会取消…", "Confirming a stable pause; resume, seeking, or leaving the page will cancel it…"],
  ["正在用本地 MediaPipe 分析当前暂停帧…", "Analyzing the paused frame locally with MediaPipe…"],
  ["允许的延后范围内没有低打断窗口；系统记录交付缺口。", "No low-disruption window exists within the allowed deferral range; the system records the delivery gap."],
  ["一旦暂停便直接全屏展示广告，不读取拖动、页面状态或画面主体。", "Immediately show a full-screen ad on pause without reading seeking, page state, or visual subjects."],
  ["切换到“复杂角色画面”可查看完整的实时信号与避让过程。", "Switch to the complex-character sample to inspect the full live-signal and avoidance process."],
  ["等待下一次稳定暂停；仍无安全位置，再交给 S1 的低打断窗口。S3 保护场景绝不补量。", "Wait for the next stable pause; if no safe position exists, hand delivery to an S1 low-disruption window. S3 protected scenes are never backfilled."],
  ["广告必须出现，", "Ads must appear—"],
  ["也不必毁掉剧情。", "without ruining the story."],
  ["一段视频，如何变成", "How does one video become"],
  ["一次投放决定？", "an ad decision?"],
  ["长视频与广告任务", "Long-form video and ad task"],
  ["看懂场景与节奏", "Understand scenes and pacing"],
  ["组合信号，逐项筛选", "Combine signals and filter candidates"],
  ["一份可执行计划", "An executable plan"],
  ["系统同时看三类信息。", "The system reads three signal layers."],
  ["视频里正在发生什么", "What is happening in the video"],
  ["用户正在怎样观看", "How the viewer is watching"],
  ["哪些边界不能越过", "Which boundaries cannot be crossed"],
  ["同一段 CHARGE，", "The same CHARGE clip,"],
  ["两次分析得到一致判断。", "two analyses reach the same decision."],
  ["目前这套原型用了什么？", "What powers the current prototype?"],
  ["保留用户的查看任务。", "Preserve the viewer's inspection task."],
  ["有些边界，价格不能越过。", "Some boundaries cannot be bought."],
  ["只改变投放决策。", "Change only the delivery decision."],
  ["避开剧情高点。", "Avoid narrative peaks."],
  ["广告延后到低打断窗口。", "Defer the ad to a lower-disruption window."],
  ["暂停，也要保护画面。", "Protect the frame during a pause."],
  ["系统判断停留、焦点与主体位置。", "Evaluate dwell time, focus, and subject position."],
  ["敏感内容，不插广告。", "No ads in sensitive content."],
  ["伦理规则直接覆盖商业投放。", "Ethical rules override commercial delivery."],
  ["求婚、医院与悲伤记忆连续出现；窗口内没有安全插播点", "Proposal, hospital, and painful memories remain continuous; no safe in-window break exists"],
  ["00:45 战斗高潮；01:25 仍需等待并改用低遮挡形式", "00:45 battle climax; at 01:25 continue waiting and use a lower-disruption format"],
  ["00:20 矿车高潮；00:51 危险已过但仍处于恢复段", "00:20 mine-cart climax; at 00:51 danger has passed but recovery is still underway"],
  ["只读取暂停、拖动与页面可见性，不推断用户脑内意图", "Read pause, seeking, and page visibility only; never infer the viewer's private intent"],
  ["00:05 识别为高紧张度真实救援；整段没有内部安全窗口，本次不投放", "00:05 identified as a high-tension real rescue; no internal safe window exists, so this ad is blocked"],
  ["来源已核验为医疗后送；API 识别出 00:26–00:38 的连续高风险任务阶段，本次不投放", "Source verified as medical evacuation; the API identifies a continuous high-risk operation from 00:26–00:38, so this ad is blocked"],
  ["真实海上救援 × 高价保量广告", "Real maritime rescue × guaranteed-delivery campaign"],
  ["美国海岸警卫队飓风救援实拍（Public Domain）", "U.S. Coast Guard hurricane rescue footage (Public Domain)"],
  ["医疗后送任务 × 高价保量广告", "Medical evacuation × guaranteed-delivery campaign"],
  ["USNS Comfort 医疗后送实拍（Public Domain）", "USNS Comfort medical evacuation footage (Public Domain)"],
  ["已核验真实救援", "Verified real rescue"],
  ["来源标注为医疗后送任务", "Source identifies a medical evacuation mission"],
  ["动作冲突", "Action conflict"],
  ["情绪连续", "Emotional continuity"],
  ["追逐高潮", "Chase climax"],
  ["简单角色画面", "Simple character frame"],
  ["复杂角色画面", "Complex character frame"],
  ["海上救援", "Maritime rescue"],
  ["医疗转运", "Medical evacuation"],
  ["体验演示", "Experience"],
  ["决策方式", "Decision logic"],
  ["AI 广告决策引擎", "AI AD DECISION ENGINE"],
  ["开始体验", "Start experience"],
  ["查看决策方式", "View decision logic"],
  ["避开剧情高点", "Avoid narrative peaks"],
  ["保护暂停时刻", "Protect pause moments"],
  ["伦理优先拦截", "Enforce ethical boundaries"],
  ["ADMIND 如何工作", "HOW ADMIND WORKS"],
  ["三层决策信号", "THREE DECISION SIGNALS"],
  ["真实 API 案例", "REAL API CASE"],
  ["技术栈", "TECH STACK"],
  ["内容信号", "Content signals"],
  ["交互信号", "Interaction signals"],
  ["约束信号", "Constraint signals"],
  ["高潮识别", "Climax detection"],
  ["情绪变化", "Emotion shifts"],
  ["镜头边界", "Shot boundaries"],
  ["稳定暂停", "Stable pause"],
  ["进度拖动", "Seeking"],
  ["页面状态", "Page state"],
  ["伦理保护", "Ethical protection"],
  ["完整播放", "Complete playback"],
  ["合同时间", "Contract timing"],
  ["独立 API 分析", "independent API analyses"],
  ["高潮判断一致", "climax agreement"],
  ["剧情恢复窗口", "narrative recovery window"],
  ["内容张力时间线", "Content-tension timeline"],
  ["真实 API 结果", "Real API result"],
  ["铺垫", "Setup"],
  ["张力上升", "Rising tension"],
  ["战斗高潮", "Battle climax"],
  ["恢复", "Recovery"],
  ["不宜打断", "Do not interrupt"],
  ["可以考虑", "Eligible"],
  ["继续等待", "Keep waiting"],
  ["进入计划", "Add to plan"],
  ["前端体验", "Front-end experience"],
  ["视频理解", "Video understanding"],
  ["决策引擎", "Decision engine"],
  ["验证方式", "Validation"],
  ["TypeScript 规则层", "TypeScript rules layer"],
  ["重复分析 + 自动测试", "Repeated analysis + automated tests"],
  ["内容信号已更新", "Content signal updated"],
  ["安全窗口", "Safe window"],
  ["模型观察", "Model observation"],
  ["规则决定", "Rule decision"],
  ["证据评分", "Evidence score"],
  ["本段不投放", "No ad in this segment"],
  ["实时伦理信号", "Live ethical signal"],
  ["实时内容信号", "Live content signal"],
  ["这一刻，为什么不能插播？", "Why can’t an ad appear now?"],
  ["这一刻，适合打断吗？", "Is this a safe moment to interrupt?"],
  ["当前播放位置", "Current playback position"],
  ["原定广告点", "Original ad point"],
  ["当前分析片段", "Current analysis segment"],
  ["等待内容信号", "Waiting for content signal"],
  ["证据时间", "Evidence time"],
  ["伦理上下文", "Ethical context"],
  ["片段张力评分", "Segment tension score"],
  ["受保护", "Protected"],
  ["待确认", "Pending"],
  ["片段级评分，不是逐帧测量", "Segment-level score, not a frame-by-frame measurement"],
  ["分析可信度", "Analysis evidence score"],
  ["模型证据评分，非统计学置信区间", "Model evidence score, not a statistical confidence interval"],
  ["当前决策", "Current decision"],
  ["内容风险", "Content risk"],
  ["当前张力", "Current tension"],
  ["伦理优先级", "Ethical priority"],
  ["模型置信", "Model evidence"],
  ["传统暂停广告：立即全屏覆盖", "Traditional pause ad: immediate full-screen takeover"],
  ["AdMind：判断交互状态，保留画面", "AdMind: evaluate interaction state and preserve the frame"],
  ["传统投放：固定时间触发", "Traditional delivery: fixed-time trigger"],
  ["AdMind：伦理规则阻止投放", "AdMind: ethical rule blocks delivery"],
  ["AdMind：窗口内不投放", "AdMind: no eligible in-window delivery"],
  ["AdMind：延后并降低遮挡", "AdMind: defer and reduce obstruction"],
  ["AdMind：等待自然转场", "AdMind: wait for a natural transition"],
  ["查看规则触发点", "View rule trigger"],
  ["查看广告投放点", "View planned ad point"],
  ["正在加载视频…", "Loading video…"],
  ["传统投放", "Traditional"],
  ["暂停 · 拖动 · 页面可见性", "Pause · seeking · page visibility"],
  ["固定投放", "fixed delivery"],
  ["受保护内容中禁止投放", "Delivery blocked in protected content"],
  ["未找到安全窗口", "No safe window found"],
  ["AI 计划", "AI plan"],
  ["广告已阻止", "Ad blocked"],
  ["实时播放器信号", "Live player signals"],
  ["这一次暂停，系统实际看到了什么？", "What did the system observe during this pause?"],
  ["确认暂停", "Confirming pause"],
  ["分析画面", "Analyzing frame"],
  ["广告已关闭", "Ad closed"],
  ["已安全展示", "Safely displayed"],
  ["已顺延", "Deferred"],
  ["等待暂停", "Waiting for pause"],
  ["暂停时长", "Pause duration"],
  ["已达到稳定阈值", "Stable threshold reached"],
  ["秒后才进入视觉判断", " seconds before visual analysis"],
  ["播放器动作", "Player action"],
  ["正在拖动", "Seeking"],
  ["播放中", "Playing"],
  ["已暂停", "Paused"],
  ["本次会话已拖动", "Seeks in this session:"],
  ["可见且有焦点", "Visible and focused"],
  ["可见但失焦", "Visible but unfocused"],
  ["页面已隐藏", "Page hidden"],
  ["当前帧视觉", "Current-frame vision"],
  ["个避让目标", " avoidance targets"],
  ["模型回退", "Model fallback"],
  ["尚未分析", "Not analyzed"],
  ["只在稳定暂停后运行一次", "Runs once after a stable pause"],
  ["最终决定", "Final decision"],
  ["这次不投，进入待交付队列", "Do not deliver now; move to the pending queue"],
  ["广告已展示，现已关闭", "Ad was displayed and is now closed"],
  ["广告已展示，任务已完成", "Ad displayed; task completed"],
  ["等待有效暂停信号", "Waiting for a valid pause signal"],
  ["全屏广告", "Full-screen ad"],
  ["静音小卡片", "Muted card"],
  ["推荐位置", "Recommended position"],
  ["风险最高", "Highest risk"],
  ["传统模式：不参与判断", "Traditional mode: no decision analysis"],
  ["基础暂停素材：保留播放器画面", "Basic pause sample: preserve the player frame"],
  ["广告任务已顺延", "Ad task deferred"],
  ["01 · 剧情高点", "01 · Narrative peaks"],
  ["02 · 用户暂停", "02 · Viewer pause"],
  ["03 · 伦理边界", "03 · Ethical boundary"],
  ["剧情高点", "Narrative peaks"],
  ["用户暂停", "Viewer pause"],
  ["伦理边界", "Ethical boundary"],
  ["正在演示", "Now showing"],
  ["跳转查看", "Jump to view"],
  ["跳过广告", "Skip ad"],
  ["暂停广告 · 静音", "Pause ad · muted"],
  ["广告 ·", "Ad ·"],
  ["静音", "Muted"],
  ["顶部", "Top "],
  ["底部", "Bottom "],
  ["左侧", "left"],
  ["右侧", "right"],
  ["无安全位置", "No safe position"],
  ["字幕", "Captions"],
  ["输入", "Input"],
  ["输出", "Output"],
  ["次", " runs"],
  ["秒", " s"],
];

const SORTED_REPLACEMENTS = [...REPLACEMENTS].sort((a, b) => b[0].length - a[0].length);
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

export function translateUiText(value: string) {
  return SORTED_REPLACEMENTS.reduce((result, [zh, en]) => result.split(zh).join(en), value);
}

function localizeText(node: Text, locale: UiLocale) {
  const remembered = originalText.get(node);
  if (locale === "zh") {
    if (remembered && node.data === translateUiText(remembered)) node.data = remembered;
    else if (!remembered || node.data !== translateUiText(remembered)) originalText.set(node, node.data);
    return;
  }

  if (!remembered || (node.data !== remembered && node.data !== translateUiText(remembered))) {
    originalText.set(node, node.data);
  }
  const source = originalText.get(node) ?? node.data;
  const translated = translateUiText(source);
  if (node.data !== translated) node.data = translated;
}

function localizeElement(element: Element, locale: UiLocale) {
  const names = ["aria-label", "alt", "title", "placeholder"];
  let remembered = originalAttributes.get(element);
  if (!remembered) {
    remembered = new Map<string, string>();
    originalAttributes.set(element, remembered);
  }
  for (const name of names) {
    const current = element.getAttribute(name);
    if (current === null) continue;
    const source = remembered.get(name) ?? current;
    remembered.set(name, source);
    element.setAttribute(name, locale === "en" ? translateUiText(source) : source);
  }

  if (element instanceof HTMLTrackElement) {
    const source = element.getAttribute("src") ?? "";
    if (source.endsWith("charge-demo-zh.vtt") || source.endsWith("charge-demo-en.vtt")) {
      element.setAttribute("src", locale === "en" ? "/charge-demo-en.vtt" : "/charge-demo-zh.vtt");
      element.setAttribute("srclang", locale === "en" ? "en" : "zh");
    }
  }
}

function localizeTree(root: Node, locale: UiLocale) {
  if (root.nodeType === Node.TEXT_NODE) localizeText(root as Text, locale);
  if (root.nodeType === Node.ELEMENT_NODE) localizeElement(root as Element, locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) localizeText(node as Text, locale);
    else localizeElement(node as Element, locale);
    node = walker.nextNode();
  }
}

export function observeUiLocalization(root: HTMLElement, locale: UiLocale) {
  localizeTree(root, locale);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") localizeTree(mutation.target, locale);
      mutation.addedNodes.forEach((node) => localizeTree(node, locale));
    }
  });
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  return () => observer.disconnect();
}
