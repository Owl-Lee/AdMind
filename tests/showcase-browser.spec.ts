import { expect, test, type Locator, type Page } from "@playwright/test";

// Browser-level regression for the public showcase: timeline jumps, strategy
// switching, S2 pause handling with the durable delivery queue, S3 blocking,
// clip switching and responsive layout. `?silent=1` mutes playback so headless
// Chromium may autoplay.

async function openShowcase(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("admind-locale", "en");
    window.localStorage.removeItem("admind-delivery-queue-v1");
  });
  await page.goto("/?silent=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".am-page")).toHaveAttribute("data-locale-ready", "true");
}

async function chapter(page: Page, id: "s1" | "s2" | "s3") {
  const section = page.locator(`#story-${id}`);
  await section.scrollIntoViewIfNeeded();
  await expect.poll(() => section.locator("video").evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(1);
  return section;
}

const currentTime = (section: Locator) => section.locator("video").evaluate((video: HTMLVideoElement) => video.currentTime);
const pressed = (section: Locator, name: "Traditional" | "AdMind") =>
  section.locator(".am-strategy").getByRole("button", { name, exact: true });

test.describe("public showcase", () => {
  test("S1 timeline markers jump to each strategy's ad moment", async ({ page }) => {
    await openShowcase(page);
    const s1 = await chapter(page, "s1");
    await expect(pressed(s1, "AdMind")).toHaveAttribute("aria-pressed", "true");

    await s1.locator(".am-marker.admind").click();
    await expect.poll(() => currentTime(s1)).toBeGreaterThan(82);
    await expect(s1.locator(".ad-overlay.card")).toBeVisible({ timeout: 15_000 });
    await expect(s1.locator(".ad-overlay.fullscreen")).toHaveCount(0);

    await s1.locator(".am-marker.baseline").click();
    await expect(pressed(s1, "Traditional")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => currentTime(s1)).toBeLessThan(46);
    await expect(s1.locator(".ad-overlay.fullscreen")).toBeVisible({ timeout: 15_000 });

    await expect(s1.locator(".am-outcome")).toContainText("model: do not interrupt");
    await expect(s1.locator(".am-outcome")).toContainText("model: wait longer");
    await expect(s1.locator(".am-provenance")).toContainText("pegasus");
  });

  test("S1 clip switching resets playback and redraws the timeline", async ({ page }) => {
    await openShowcase(page);
    const s1 = await chapter(page, "s1");
    await s1.locator(".am-variants").getByRole("button", { name: "Emotional continuity" }).click();
    await expect(s1.locator(".am-marker")).toHaveCount(1);
    await expect(s1.locator(".am-marker.baseline")).toBeVisible();
    await expect(s1.locator(".am-outcome")).toContainText("No delivery in the window");
    await expect.poll(() => currentTime(s1)).toBeLessThan(1);
  });

  test("S2 short pause defers into the durable queue and S1 delivers it", async ({ page }) => {
    await openShowcase(page);
    const s2 = await chapter(page, "s2");
    const video = s2.locator("video");
    await video.evaluate(async (element: HTMLVideoElement) => {
      element.currentTime = 20;
      await element.play();
    });
    await page.waitForTimeout(1_200);
    await video.click();
    await expect(s2.locator(".pause-phase.observing")).toBeVisible();
    await page.waitForTimeout(400);
    await video.click();
    await expect(s2.locator(".pause-phase.deferred")).toBeVisible();
    await expect(s2.locator(".am-queue.has-pending")).toContainText("1 ad task(s) waiting to be delivered");
    await expect.poll(() => page.evaluate(() => {
      const raw = window.localStorage.getItem("admind-delivery-queue-v1");
      return raw ? (JSON.parse(raw) as { tasks: { status: string }[] }).tasks.filter((task) => task.status === "pending").length : 0;
    })).toBe(1);

    const s1 = await chapter(page, "s1");
    await expect(s1.locator(".am-queue.has-pending")).toBeVisible();
    await s1.locator(".am-marker.admind").click();
    await expect(s1.locator(".ad-overlay.card")).toBeVisible({ timeout: 15_000 });
    await expect(s1.locator(".am-queue")).toHaveCount(0);
    await expect(s2.locator(".am-queue")).toContainText("low-disruption window");
  });

  test("S2 stable pause runs local vision and either places a card or defers", async ({ page }) => {
    await openShowcase(page);
    const s2 = await chapter(page, "s2");
    const video = s2.locator("video");
    await video.evaluate(async (element: HTMLVideoElement) => {
      element.currentTime = 20;
      await element.play();
    });
    await page.waitForTimeout(1_200);
    await video.click();
    await expect(s2.locator(".pause-phase.delivered, .pause-phase.deferred")).toBeVisible({ timeout: 60_000 });
    const delivered = await s2.locator(".pause-phase.delivered").count();
    if (delivered) {
      await expect(s2.locator(".ad-overlay.card")).toBeVisible();
      await expect(s2.locator(".ad-overlay.fullscreen")).toHaveCount(0);
    } else {
      await expect(s2.locator(".am-queue.has-pending")).toBeVisible();
    }
  });

  test("S3 traditional interrupts the rescue while AdMind blocks it", async ({ page }) => {
    await openShowcase(page);
    const s3 = await chapter(page, "s3");
    await s3.locator(".am-marker.baseline").click();
    await expect(pressed(s3, "Traditional")).toHaveAttribute("aria-pressed", "true");
    await expect(s3.locator(".ad-overlay.fullscreen")).toBeVisible({ timeout: 15_000 });

    await pressed(s3, "AdMind").click();
    await s3.locator(".am-timeline-head button").click();
    await expect(s3.locator(".am-protection-note")).toBeVisible({ timeout: 15_000 });
    await expect(s3.locator(".ad-overlay")).toHaveCount(0);
    await expect(s3.locator(".am-timeline-protected")).toContainText("Protected content");
    await expect(s3.locator(".am-outcome")).toContainText("No ads in the whole clip");
  });

  test("showcase and decision views fit every breakpoint in both languages", async ({ page }) => {
    await openShowcase(page);
    for (const width of [360, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const hash of ["#demo", "#decision"]) {
        await page.evaluate((next) => { window.location.hash = next; }, hash);
        await page.waitForTimeout(150);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${hash} overflows at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
    // The aria-label itself is localized after hydration, so target the toggle directly.
    const language = page.locator(".am-lang");
    await language.getByRole("button", { name: "中", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.locator("#story-s1 .am-timeline-head")).toContainText("剧情张力时间线");
    await language.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.locator("#story-s1 .am-timeline-head")).toContainText("Story-tension timeline");
  });
});
