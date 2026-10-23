import { test, expect } from "@playwright/test";
const GAME = "/games/twenty-four/";
const tiles = (page) => page.locator("#cards [data-tile]");
async function press(locator, touch = false) {
  if (touch) await locator.tap();
  else await locator.click();
}
async function start(page, mode = "slow", touch = false) {
  await page.goto(GAME);
  await press(page.locator(`[data-mode="${mode}"]`), touch);
  await press(page.locator("#startRoundBtn"), touch);
  await expect(page.locator("#roundGate")).toBeHidden();
  await expect(tiles(page)).toHaveCount(4);
}
async function combine(page, from, op, to, touch = false) {
  await press(page.locator(`[data-tile="${from}"]`), touch);
  await press(page.locator(`[data-operator="${op}"]`), touch);
  await press(page.locator(`[data-tile="${to}"]`), touch);
}
async function solveFirst(page, touch = false) {
  // Original bank first puzzle: [2, 6, 6, 12]. ((2 + 6) - 6) * 12 = 24.
  await combine(page, 0, "+", 1, touch);
  await combine(page, 1, "-", 2, touch);
  await combine(page, 2, "*", 3, touch);
}
async function fits(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
}

test("portal opens the exact original game and browser Back returns to lobby", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await fits(page);
  await page.getByRole("link", { name: /数字探险家/ }).click();
  await expect(page).toHaveTitle("24点 · 数字探险家");
  await expect(page.locator("h1")).toContainText("点一点，合成 24");
  await expect(page.locator("#roundGate")).toBeVisible();
  await fits(page);
  await page.goBack();
  await expect(page.locator(".game-card")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("original modes, sound toggle and native AudioContext activate on interaction", async ({
  page,
}) => {
  await page.goto(GAME);
  for (const [mode, seconds] of [
    ["fast", 10],
    ["standard", 30],
    ["slow", 60],
  ]) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await expect(page.locator("#timeValue")).toHaveText(`${seconds}秒`);
    await expect(page.locator("#gateText")).toContainText(`每题 ${seconds} 秒`);
  }
  await expect(page.locator("#soundBtn")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#soundBtn").click();
  await expect(page.locator("#soundBtn")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("#soundBtn").click();
  await expect(page.locator("#soundBtn")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#startRoundBtn").click();
  await expect.poll(() => page.evaluate(() => audioCtx?.state)).toBe("running");
  await expect(page.locator("#timerState")).toHaveText("倒计时");
});
test("original solve shows success, explanation and next question", async ({
  page,
}) => {
  await start(page);
  await solveFirst(page);
  await expect(page.locator("#feedback")).toHaveClass("feedback ok");
  await expect(page.locator("#feedback h3")).toContainText("24 合成成功");
  await expect(page.locator("#timerState")).toHaveText("答对啦");
  await expect(page.locator("#totalStars")).toHaveText("3");
  await expect(page.locator("#restartBtn")).toBeDisabled();
  await page.locator("#explainBtn").click();
  await expect(page.locator("#analysis")).toBeVisible();
  await expect(page.locator("#solutionBody .equation")).toContainText("= 24");
  await page.locator("#nextBtn").click();
  await expect(page.locator("#levelTitle")).toContainText("第 2 / 10 题");
  await expect(tiles(page)).toHaveCount(4);
  await expect(page.locator("#roundProgress")).toHaveText("本轮 1/10");
});
test("original incorrect answer, undo, restart and division-by-zero recovery", async ({
  page,
}) => {
  await start(page);
  await combine(page, 0, "+", 1);
  await combine(page, 1, "+", 2);
  await combine(page, 2, "+", 3);
  await expect(page.locator("#feedback h3")).toContainText("这次合成了 26");
  await page.locator("#retryStepBtn").click();
  await expect(tiles(page)).toHaveCount(2);
  await page.locator("#restartBtn").click();
  await expect(tiles(page)).toHaveCount(4);
  await combine(page, 1, "-", 2);
  await combine(page, 0, "/", 2);
  await expect(page.locator("#boardMessage")).toContainText("0 不能做除数");
  await expect(tiles(page)).toHaveCount(3);
  await page.locator("#undoMergeBtn").click();
  await expect(tiles(page)).toHaveCount(4);
});
test("timer pauses in help, restart does not reset time, timeout advances", async ({
  page,
}) => {
  await page.clock.install();
  await start(page, "fast");
  await page.clock.runFor(2100);
  await combine(page, 0, "+", 1);
  const beforeRestart = Number(
    (await page.locator("#timeValue").textContent()).replace("秒", ""),
  );
  await page.locator("#restartBtn").click();
  expect(
    Number((await page.locator("#timeValue").textContent()).replace("秒", "")),
  ).toBeLessThanOrEqual(beforeRestart);
  await page.locator("#helpBtn").click();
  await expect(page.locator("#helpDialog")).toBeVisible();
  const paused = await page.locator("#timeValue").textContent();
  await page.clock.runFor(2000);
  await expect(page.locator("#timeValue")).toHaveText(paused);
  await page.getByRole("button", { name: "关闭说明", exact: true }).click();
  await page.clock.runFor(10000);
  await page.clock.runFor(1600);
  await expect(page.locator("#levelTitle")).toContainText("第 2 / 10 题");
  await expect(page.locator('[data-question="0"]')).toHaveClass(/timedout/);
});
test("mobile taps solve the original game without keyboard input", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Touch test uses phone profiles");
  await start(page, "slow", true);
  await solveFirst(page, true);
  await expect(page.locator("#feedback")).toHaveClass("feedback ok");
  await fits(page);
});
test("pointer dragging combines two original cards", async ({ page }) => {
  await start(page);
  await page.locator('[data-operator="+"]').click();
  await page.locator("#cards").scrollIntoViewIfNeeded();
  const from = await page.locator('[data-tile="0"]').boundingBox(),
    to = await page.locator('[data-tile="1"]').boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(tiles(page)).toHaveCount(3);
  await expect(page.locator('[data-tile="1"]')).toHaveAttribute(
    "aria-label",
    "合成的数字 8，第 2 个位置",
  );
});
test("capture lobby and original game for visual review", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page
    .locator(".game-card img")
    .evaluate(async (image) => image.decode());
  await page.screenshot({
    path: testInfo.outputPath("portal.png"),
    fullPage: true,
    animations: "disabled",
  });
  await start(page);
  await page.locator("#helpBtn").click();
  await page.getByRole("button", { name: "关闭说明", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("twenty-four.png"),
    fullPage: true,
    animations: "disabled",
  });
});
