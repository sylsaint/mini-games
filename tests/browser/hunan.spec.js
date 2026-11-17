import { test, expect } from "@playwright/test";
test("Hunan guide navigation, passport, translation and quiz work", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/travel/hunan/");
  await expect(page).toHaveTitle(/长沙·岳阳/);
  await expect(page.locator(".station")).toHaveCount(7);
  await expect(page.locator(".person-card")).toHaveCount(16);
  await expect(page.locator(".poem-card")).toHaveCount(7);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.locator(".station:not([hidden]) [data-stamp]").click();
  await expect(page.locator("#passport-count")).toHaveText("1");
  await page.reload();
  await expect(page.locator("#passport-count")).toHaveText("1");
  await page.locator('.station:not([hidden]) [data-step="1"]').click();
  await expect(page.locator(".station:not([hidden])")).toContainText("马王堆");
  await page.locator("[data-translate]").first().click();
  await expect(page.locator(".poem-translation").first()).toBeVisible();
  await page.locator("[data-translate]").first().click();
  await expect(page.locator(".poem-translation").first()).toBeHidden();
  const answer = await page.evaluate(
    async () =>
      (await (await fetch("./data/guide.json")).json()).stations.flatMap(
        (s) => s.quiz || [],
      )[0].answer,
  );
  await page.locator(`[data-option="${answer}"]`).click();
  await expect(page.locator("#quiz-feedback")).toContainText("答对");
  await page.locator("#next-quiz").click();
  await expect(page.locator("#quiz-counter")).toContainText("2 /");
  expect(errors).toEqual([]);
});

test("Hunan real photos load and enlarged photo closes", async ({ page }) => {
  await page.goto("/travel/hunan/");
  await expect(page.locator(".station")).toHaveCount(7);
  const photos = await page.evaluate(
    async () => (await (await fetch("./data/guide.json")).json()).photos,
  );
  expect(photos).toHaveLength(9);
  for (const photo of photos) {
    expect(photo.src).toMatch(/^\.\/assets\/[a-f0-9]+\.jpg$/);
    expect(
      await page.evaluate(
        (src) =>
          new Promise((resolve) => {
            const i = new Image();
            i.onload = () => resolve(i.naturalWidth > 0);
            i.onerror = () => resolve(false);
            i.src = src;
          }),
        photo.src,
      ),
    ).toBeTruthy();
  }
  await page.locator("[data-photo]").first().click();
  await expect(page.locator("#photo-dialog")).toBeVisible();
  await page.locator("#photo-dialog-close").click();
  await expect(page.locator("#photo-dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
});

test("Hunan loads a small shell and defers unseen photos and offline code", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.addInitScript(() =>
    localStorage.setItem("xiangxing-passport-v1", '["city","yuelu"]'),
  );
  // Slow media must not prevent reading or using already-saved stamps.
  await page.route("**/hunan/assets/*", async (route) => {
    await new Promise((r) => setTimeout(r, 350));
    await route.continue();
  });
  const response = await page.goto("/travel/hunan/", {
    waitUntil: "domcontentloaded",
  });
  expect((await response.body()).length).toBeLessThan(25000);
  await expect(page.locator(".station")).toHaveCount(7);
  await expect(page.locator("#passport-count")).toHaveText("2");
  const data = await page.evaluate(
    async () => await (await fetch("./data/guide.json")).json(),
  );
  const later = data.photos.find((p) => p.id === "yuelu-pavilion-2008");
  expect(requests.some((url) => url.endsWith(later.src.slice(1)))).toBeFalsy();
  expect(requests.some((url) => url.endsWith("/offline.js"))).toBeFalsy();
  await page.locator('[data-select="yuelu"]').click();
  const image = page.locator("#station-yuelu img").first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute("src", later.src);
  await expect
    .poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
    .toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
});

test("Hunan full offline export works without network", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/travel/hunan/");
  await expect(page.locator(".station")).toHaveCount(7);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-download]").first().click(),
  ]);
  const file = testInfo.outputPath("hunan-offline.html");
  await download.saveAs(file);
  const offline = await context.newPage();
  const errors = [];
  offline.on("pageerror", (e) => errors.push(e.message));
  await context.setOffline(true);
  await offline.goto("file://" + file);
  await expect(offline.locator(".station")).toHaveCount(7);
  await expect(offline.locator(".person-card")).toHaveCount(16);
  await offline.locator('[data-select="yuelu"]').click();
  await expect(offline.locator(".station:not([hidden])")).toContainText(
    "爱晚亭",
  );
  await offline.locator("[data-photo]").first().click();
  await expect(offline.locator("#photo-dialog")).toBeVisible();
  await expect
    .poll(() =>
      offline
        .locator("#photo-dialog-image")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBeTruthy();
  await offline.locator("#photo-dialog-close").click();
  await offline.locator(".station:not([hidden]) [data-stamp]").click();
  await expect(offline.locator("#passport-count")).toHaveText("1");
  expect(errors).toEqual([]);
  await context.setOffline(false);
});

test("Hunan content failure offers a recoverable retry", async ({ page }) => {
  await page.route("**/hunan/data/guide.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/travel/hunan/");
  await expect(page.locator("#load-status")).toContainText("加载失败");
  await page.unroute("**/hunan/data/guide.json");
  await page.getByRole("button", { name: "重新加载", exact: true }).click();
  await expect(page.locator(".station")).toHaveCount(7);
});
