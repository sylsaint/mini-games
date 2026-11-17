import { test, expect } from "@playwright/test";
test("Hunan guide navigation, passport, translation and quiz work", async ({
  page,
}, testInfo) => {
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
  await page.screenshot({path:testInfo.outputPath("hunan-guide.png"),fullPage:false});
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
  expect(requests.some((url) => /\/offline(?:[.-][^/]*)?\.js(?:\?|$)/.test(url))).toBeFalsy();
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

test("Hunan local speech selection, preference and cancellation are robust", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const events = new EventTarget();
    const voices = [
      { name: "Eddy", voiceURI: "eddy", lang: "zh-CN", localService: true },
      { name: "Yu-shu", voiceURI: "yushu", lang: "zh-CN", localService: true },
      {
        name: "Google 普通话",
        voiceURI: "google",
        lang: "zh-CN",
        localService: false,
      },
    ];
    window.__speech = { ready: false, calls: [], last: null, cancels: 0 };
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        constructor(text) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => (window.__speech.ready ? voices : []),
        addEventListener: (...args) => events.addEventListener(...args),
        removeEventListener: (...args) => events.removeEventListener(...args),
        cancel: () => {
          window.__speech.cancels++;
        },
        speak: (u) => {
          window.__speech.last = u;
          window.__speech.calls.push({
            text: u.text,
            voice: u.voice.name,
            rate: u.rate,
          });
        },
      },
    });
    window.__readySpeech = () => {
      window.__speech.ready = true;
      events.dispatchEvent(new Event("voiceschanged"));
    };
  });
  await page.goto("/travel/hunan/");
  await expect(page.locator(".station")).toHaveCount(7);
  await page.locator("#speech-settings summary").click();
  await expect(page.locator("#speech-status")).toContainText("还没有");
  await page.evaluate(() => window.__readySpeech());
  await expect(page.locator("#speech-voice")).toHaveValue("yushu|zh-CN");
  await expect(page.locator("#speech-voice option")).toHaveCount(2);
  expect(await page.evaluate(() => window.__speech.cancels)).toBe(0);
  await page.locator("#speech-preview").click();
  expect(await page.evaluate(() => window.__speech.calls[0])).toEqual({
    text: "沿着山水，读一读湖南。",
    voice: "Yu-shu",
    rate: 0.95,
  });
  await page.locator("#speech-preview").click();
  await page.evaluate(() => window.__speech.last.onend());
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => window.__speech.calls.length)).toBe(2);
  await expect(page.locator("#speech-preview")).toHaveText("试听声音");
  await page.locator("#speech-voice").selectOption("eddy|zh-CN");
  await page.locator("#speech-rate").selectOption("1");
  await page.reload();
  await page.evaluate(() => window.__readySpeech());
  await expect(page.locator("#speech-voice")).toHaveValue("eddy|zh-CN");
  await expect(page.locator("#speech-rate")).toHaveValue("1");
  await page.locator("#speech-settings summary").click();
  await page.locator("#speech-preview").click();
  await page.evaluate(() =>
    window.__speech.last.onerror({ error: "voice-unavailable" }),
  );
  await expect(page.locator("#speech-status")).toContainText(
    "voice-unavailable",
  );
  await expect(page.locator("#speech-status")).toContainText("另一种本机音色");
  await expect(page.locator("#speech-preview")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test('Hunan component callbacks keep filtering, map, parent mode and repeated actions isolated', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/travel/hunan/#station-mawangdui');
  await expect(page.locator('.station:not([hidden])')).toHaveAttribute('id', 'station-mawangdui');
  // A foreign control must not be interpreted by a document-level travel dispatcher.
  await page.evaluate(() => {
    const unrelated = document.createElement('button');
    unrelated.dataset.stamp = 'city';
    document.body.append(unrelated);
    unrelated.click();
    unrelated.remove();
  });
  await expect(page.locator('#passport-count')).toHaveText('0');
  await page.locator('[data-mode="parent"]').click();
  await expect(page.locator('#station-mawangdui .parent-details')).toHaveAttribute('open', '');
  await page.locator('[data-mode="story"]').click();
  await expect(page.locator('#station-mawangdui .parent-details')).not.toHaveAttribute('open');
  await page.locator('#station-mawangdui [data-layer="3"]').click();
  await expect(page.locator('#station-mawangdui .seal-explain')).toContainText('木椁');
  await page.locator('#station-search').fill('不存在的景点');
  await expect(page.locator('.no-results')).toBeVisible();
  await page.locator('[data-station="dongting"]').click();
  await expect(page.locator('#station-search')).toHaveValue('');
  await expect(page.locator('.station:not([hidden])')).toHaveAttribute('id', 'station-dongting');
  await page.locator('#station-dongting .lake-toggle').click();
  await expect(page.locator('#station-dongting .lake-demo')).toHaveClass(/night/);
  await page.locator('#station-dongting .lake-toggle').click();
  await expect(page.locator('#station-dongting .lake-demo')).not.toHaveClass(/night/);
  await page.locator('#station-dongting [data-stamp] svg').click();
  await page.locator('#station-dongting [data-stamp]').click();
  await expect(page.locator('#passport-count')).toHaveText('1');
  const answer = await page.evaluate(async () => (await (await fetch('./data/guide.json')).json()).stations.flatMap(s => s.quiz)[0].answer);
  const wrong = (answer + 1) % await page.locator('[data-option]').count();
  await page.locator(`[data-option="${wrong}"]`).click();
  await expect(page.locator(`[data-option="${wrong}"]`)).toBeDisabled();
  await expect(page.locator('#quiz-feedback')).toContainText('再想一想');
  await page.locator(`[data-option="${answer}"]`).click();
  await expect(page.locator('#quiz-feedback')).toContainText('答对');
  await page.locator('#next-quiz').click();
  await expect(page.locator('#quiz-feedback')).toBeHidden();
  await expect(page.locator('[data-option]').first()).toBeEnabled();
  await page.locator('[data-photo]').first().click();
  await expect(page.locator('#photo-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#photo-dialog')).not.toBeVisible();
  await page.locator('[data-photo]').first().click();
  await page.locator('#photo-dialog-close').click();
  await expect(page.locator('#photo-dialog-image')).not.toHaveAttribute('src');
  expect(errors).toEqual([]);
});
