import { test, expect } from "@playwright/test";
const route = "/games/escape-mawangdui/";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.escapeTestRolls = [];
    Math.random = () => window.escapeTestRolls.shift() ?? 0.5;
  });
});

test("escape game mobile economy, tools, merging and restart controls", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(route);
  await page.getByRole("button", { name: "开始冒险 · 20分钟 →" }).click();
  await expect(
    page.getByRole("button", { name: "＋ 招募一级工人 · 1金币" }),
  ).toBeDisabled();
  await page.clock.fastForward(10000);
  await page.getByRole("button", { name: "＋ 招募一级工人 · 1金币" }).click();
  await page.getByRole("button", { name: "小铲 · 3币", exact: true }).click();
  await expect(page.getByText("装上小铲，速度提升25%！")).toBeVisible();
  await page.getByRole("button", { name: "Lv.1 ×2 → 2" }).click();
  await expect(page.getByText("合成2级工人！")).toBeVisible();
  await page.getByRole("button", { name: "重新开始", exact: true }).click();
  await page.getByRole("button", { name: "继续本局" }).click();
  await expect(page.getByText("合成2级工人！")).toBeVisible();
  await page.getByRole("button", { name: "重新开始", exact: true }).click();
  await page.getByRole("button", { name: "确认重开" }).click();
  await expect(
    page.getByRole("button", { name: "＋ 招募一级工人 · 1金币" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/escape-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("inaction loses at deadline and cannot recruit after game over", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(route);
  await page.getByRole("button", { name: "开始冒险 · 20分钟 →" }).click();
  await page.clock.fastForward(1200000);
  await expect(
    page.getByRole("heading", { name: "时间到了，挑战结束" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "＋ 招募一级工人 · 1金币" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "重新挑战" }).click();
  await expect(page.getByText("20:00", { exact: true })).toBeVisible();
});
test("two recruits and paid rope meals win without rapid clicking", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(route);
  await page.getByRole("button", { name: "开始冒险 · 20分钟 →" }).click();
  await page.clock.fastForward(10000);
  await page.getByRole("button", { name: "＋ 招募一级工人 · 1金币" }).click();
  await page.clock.fastForward(10000);
  await page.getByRole("button", { name: "＋ 招募一级工人 · 2金币" }).click();
  await page.clock.fastForward(580000);
  await page.getByRole("button", { name: "买食物 · 2币 / 3份" }).click();
  await page.getByRole("button", { name: "买食物 · 2币 / 3份" }).click();
  await page.getByRole("button", { name: "🪢 接人上来吃饭" }).click();
  await expect(page.getByRole("button", { name: "拉绳中…" })).toBeDisabled();
  await page.clock.fastForward(2000);
  await page.getByRole("button", { name: "🪢 接人上来吃饭" }).click();
  await page.clock.fastForward(2000);
  await page.clock.fastForward(500000);
  await expect(
    page.getByRole("heading", { name: "☀ 成功逃生！" }),
  ).toBeVisible();
});

test("dig a variety of real-inspired treasures, keep base coins, and trade each at its own value", async ({
  page,
  isMobile,
}) => {
  await page.clock.install();
  await page.goto(route);
  const click = (locator) => (isMobile ? locator.tap() : locator.click());
  const status = (id) => page.getByTestId("escape-" + id);
  await page.evaluate(() => {
    // Midpoints of six treasure bands, then one worker and one food band.
    window.escapeTestRolls = [
      0.002, 0.005, 0.0072, 0.0085, 0.0093, 0.0098, 0.013, 0.025,
    ];
  });
  await click(page.getByRole("button", { name: "开始冒险 · 20分钟 →" }));
  await page.clock.fastForward(20000);
  await expect(status("coins")).toContainText(/\b8\b/);
  await expect(status("food")).toContainText(/\b3\b/);
  await expect(status("team")).toContainText(/5\s*\/\s*5/);
  await expect(status("loot-latest")).toContainText("食物包");
  await expect(
    page.getByRole("button", { name: "选择工人5，1级" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "＋ 招募一级工人 · 1金币" }),
  ).toBeEnabled();
  const loot = [
    ["lacquer-cup", 3],
    ["cat-dish", 6],
    ["gauze-robe", 10],
    ["silk-map", 13],
    ["t-silk-painting", 15],
    ["li-cang-seal", 20],
  ];
  let coins = 8;
  for (const [id, value] of loot) {
    const count = status("treasure-count-" + id);
    const sell = status("treasure-sell-" + id);
    await expect(count).toHaveText("1");
    await expect(sell).toContainText(String(value));
    await click(sell);
    coins += value;
    await expect(count).toHaveText("0");
    await expect(sell).toBeDisabled();
    await expect(status("coins")).toContainText(
      new RegExp("\\b" + coins + "\\b"),
    );
  }
  await click(page.getByRole("button", { name: "🪢 接人上来吃饭" }));
  await page.clock.fastForward(2000);
  await expect(status("food")).toContainText(/\b0\b/);
  await expect(page.getByText(/3位工人在地表吃饱/)).toBeVisible();
  await expect(status("treasure-pouch")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
