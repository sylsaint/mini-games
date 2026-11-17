import { test, expect } from '@playwright/test';
test('Hunan guide navigation, passport, translation and quiz work', async ({page}) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/travel/hunan/');
  await expect(page).toHaveTitle(/长沙·岳阳/);
  await expect(page.locator('.station')).toHaveCount(7);
  await expect(page.locator('.person-card')).toHaveCount(16);
  await expect(page.locator('.poem-card')).toHaveCount(7);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.locator('.station:not([hidden]) [data-stamp]').click();
  await expect(page.locator('#passport-count')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#passport-count')).toHaveText('1');
  await page.locator('.station:not([hidden]) [data-step="1"]').click();
  await expect(page.locator('.station:not([hidden])')).toContainText('马王堆');
  await page.locator('[data-translate]').first().click();
  await expect(page.locator('.poem-translation').first()).toBeVisible();
  await page.locator('[data-translate]').first().click();
  await expect(page.locator('.poem-translation').first()).toBeHidden();
  const answer=await page.evaluate(()=>JSON.parse(document.querySelector('#guide-data').textContent).stations.flatMap(s=>s.quiz||[])[0].answer);
  await page.locator(`[data-option="${answer}"]`).click();
  await expect(page.locator('#quiz-feedback')).toContainText('答对');
  await page.locator('#next-quiz').click();
  await expect(page.locator('#quiz-counter')).toContainText('2 /');
  expect(errors).toEqual([]);
});

test('Hunan real photos load and enlarged photo closes', async ({page}) => {
  await page.goto('/travel/hunan/');
  const photos = await page.evaluate(() => JSON.parse(document.querySelector('#guide-data').textContent).photos);
  expect(photos).toHaveLength(9);
  for (const photo of photos) {
    expect(photo.src).toMatch(/^data:image\//);
    expect(await page.evaluate(src => new Promise(resolve => { const i = new Image(); i.onload=()=>resolve(i.naturalWidth>0); i.onerror=()=>resolve(false); i.src=src; }), photo.src)).toBeTruthy();
  }
  await page.locator('[data-photo]').first().click();
  await expect(page.locator('#photo-dialog')).toBeVisible();
  await page.locator('#photo-dialog-close').click();
  await expect(page.locator('#photo-dialog')).not.toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
