import { test, expect } from "@playwright/test";
async function combine(page, a, op, b) {
  await page
    .getByRole("button", { name: `数字 ${a}`, exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: op, exact: true }).click();
  await page
    .locator(`.number-card[aria-label="数字 ${b}"][aria-pressed="false"]`)
    .first()
    .click();
}
test("portal registers game, no horizontal overflow, enter/back works", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "今天，玩点什么？" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /24 点实验室/ }).click();
  await expect(
    page.getByRole("heading", { name: /24 点实验室/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("link", { name: "← 游戏大厅" }).click();
  await expect(page.locator(".game-card")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("solve, avoid duplicate score, restart, next, undo, failure and hint", async ({
  page,
}) => {
  await page.goto("/games/twenty-four/");
  await combine(page, "1", "加", "2");
  await combine(page, "3", "加", "3");
  await combine(page, "4", "乘", "6");
  await expect(page.locator("#feedback")).toHaveClass("success");
  await expect(page.locator("#score")).toHaveText("已解锁 1 题");
  await page.getByRole("button", { name: "↶ 撤销" }).click();
  await combine(page, "4", "乘", "6");
  await expect(page.locator("#score")).toHaveText("已解锁 1 题");
  await page.getByRole("button", { name: "重新开始" }).click();
  await expect(page.locator(".number-card")).toHaveCount(4);
  await combine(page, "1", "加", "2");
  await combine(page, "3", "加", "3");
  await combine(page, "4", "加", "6");
  await expect(page.locator("#feedback")).toHaveClass("failure");
  await page.getByRole("button", { name: "下一题 →" }).click();
  await expect(page.locator("#round")).toHaveText("第 2 题");
  await page.locator("summary").click();
  await expect(page.locator("#hint")).toContainText("= 24");
});
test("fraction puzzle and zero divisor recover without losing cards", async ({
  page,
}) => {
  await page.goto("/games/twenty-four/");
  await page.getByRole("button", { name: "下一题 →" }).click();
  await combine(page, "8", "除", "3");
  await combine(page, "3", "减", "8/3");
  await combine(page, "8", "除", "1/3");
  await expect(page.locator("#feedback")).toHaveClass("success");
  await page.getByRole("button", { name: "重新开始" }).click();
  await combine(page, "3", "减", "3");
  await combine(page, "8", "除", "0");
  await expect(page.locator("#feedback")).toContainText("不能除以 0");
  await expect(page.locator(".number-card")).toHaveCount(3);
  await page.getByRole("button", { name: "重新开始" }).click();
  await expect(page.locator(".number-card")).toHaveCount(4);
});
test("mobile touch combines cards and both layouts fit viewport", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Touch test applies to phone profiles");
  await page.goto("/");
  await expect(page.locator(".game-card")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.locator(".game-card").tap();
  await page.getByRole("button", { name: "数字 1", exact: true }).tap();
  await page.getByRole("button", { name: "加", exact: true }).tap();
  await page.getByRole("button", { name: "数字 2", exact: true }).tap();
  await expect(page.locator(".number-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("capture portal and game for visual review", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await expect(page.locator(".game-card img")).toBeVisible();
  await page.locator(".game-card img").evaluate(async (image) => {
    await image.decode();
  });
  await page.screenshot({
    path: testInfo.outputPath("portal.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.locator(".game-card").click();
  await expect(page.locator(".number-card")).toHaveCount(4);
  await page.screenshot({
    path: testInfo.outputPath("twenty-four.png"),
    fullPage: true,
    animations: "disabled",
  });
});
