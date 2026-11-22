import { test, expect } from "@playwright/test";

test("retired treasure game is absent from the lobby, catalog, and direct routes", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator(".game-card")).toHaveCount(2);
  await expect(page.getByRole("link", { name: /逃出马王堆/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /马王堆寻宝/ })).toHaveCount(0);
  const catalog = await request.get("/games.json");
  expect(catalog.ok()).toBe(true);
  expect((await catalog.json()).map((game) => game.id)).toEqual([
    "twenty-four",
    "escape-mawangdui",
  ]);
  for (const route of [
    "/games/mawangdui-treasure/",
    "/games/mawangdui-treasure/index.html",
  ]) {
    const retired = await request.get(route);
    expect(retired.status()).toBe(404);
    expect(await retired.text()).not.toContain("treasure-start");
  }
});
