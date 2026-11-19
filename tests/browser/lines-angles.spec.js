import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
test.setTimeout(90_000);
const path = '/learning/math/lines-and-angles/';
const key = 'yoyo-math-lines-angles-v1';
const comprehensiveKey = 'yoyo-math-grade4-fall-v1';
const bank = JSON.parse(readFileSync(new URL('../../packages/education/src/lines-angles/bank.json', import.meta.url)));
const question = page => page.getByRole('region', { name: '当前题目', exact: true });
const jump = (page, n) => page.getByRole('button', { name: new RegExp(`^第${n}题，`) }).click();
async function begin(page, bonus = false) {
  await page.goto(path);
  if (bonus) await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '开始练习 →' }).click();
}
async function noAnswers(page) {
  await expect(page.locator('.explanation')).toHaveCount(0);
  await expect(page.getByText('参考答案：', { exact: false })).toHaveCount(0);
}

test('all 24 questions have accessible responsive SVGs and no pre-submission explanation or timer', async ({ page }, testInfo) => {
  await begin(page, true);
  await expect(page.getByText('不计时', { exact: true })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveCount(0);
  for (let n = 1; n <= 24; n++) {
    await jump(page, n);
    const svg = question(page).locator('svg[role="img"]');
    await expect(svg).toHaveCount(1); await expect(svg).toBeVisible();
    expect(await svg.getAttribute('viewBox')).toBeTruthy();
    expect(await svg.evaluate(el => !!(el.getAttribute('aria-label') || el.querySelector('title')?.textContent))).toBeTruthy();
    await noAnswers(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `question ${n} does not overflow`).toBeTruthy();
    const bounds = await svg.boundingBox(); const viewport = page.viewportSize();
    expect(bounds.x).toBeGreaterThanOrEqual(-1); expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
    if ([1,11,14,15,16,18,19,23,24].includes(n)) await question(page).screenshot({path:testInfo.outputPath(`lines-angles-${n}.png`),animations:"disabled"});
  }
});

test('choice and numeric answers survive skipping, returning and reload without changing comprehensive records', async ({ page }) => {
  const original = JSON.stringify({ version: 1, answers: { q01: '8000 次' }, index: 2, started: true, submitted: false, extension: true });
  await page.addInitScript(({ k, raw }) => { if (localStorage.getItem(k) === null) localStorage.setItem(k, raw); }, { k: comprehensiveKey, raw: original });
  await begin(page);
  await page.getByRole('radio', { name: 'C 线段', exact: true }).check();
  await page.getByRole('button', { name: '下一题 →' }).click();
  await page.getByRole('button', { name: '先跳过 →' }).click();
  await page.reload(); await expect(page.locator('#question-title')).toHaveText(bank[2].prompt);
  await jump(page, 1); await expect(page.getByRole('radio', { name: 'C 线段', exact: true })).toBeChecked();
  await jump(page, 5); await page.getByLabel('你的答案').fill('90');
  await page.reload(); await expect(page.getByLabel('你的答案')).toHaveValue('90');
  await noAnswers(page);
  expect(await page.evaluate(k => localStorage.getItem(k), comprehensiveKey)).toBe(original);
});

test('measurements, actual left-base drawing, keyboard and touch-sized controls persist without auto-answering', async ({ page, isMobile }) => {
  await begin(page);
  await jump(page, 14); await expect(question(page).getByRole('img')).toHaveAccessibleDescription(/55.*125/); await expect(page.getByLabel('我的读数', { exact: true })).toHaveValue('');
  await page.getByLabel('我的读数', { exact: true }).fill('55');
  await jump(page, 15); await page.getByLabel('我的读数', { exact: true }).fill('75');
  await jump(page, 16);
  const number = page.getByLabel('我画的角', { exact: true });
  await expect(number).toHaveValue('');
  const svg = question(page).locator('svg');
  // Transform a real point on the upper-left 120° ray to the viewport. From a LEFT base this is 60°.
  await svg.scrollIntoViewIfNeeded();
  const point = await svg.evaluate(el => {
    const p = el.createSVGPoint(); p.x = 220 + 150 * Math.cos(120 * Math.PI / 180); p.y = 208 - 150 * Math.sin(120 * Math.PI / 180);
    const screen = p.matrixTransform(el.getScreenCTM()); return { x: screen.x, y: screen.y };
  });
  if (isMobile) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
  await expect(number).toHaveValue('60');
  const slider = page.getByRole('slider', { name: '调整所画角的角度', exact: true });
  await expect(slider).toHaveAttribute('aria-valuenow', '60');
  await slider.press('ArrowRight'); await expect(number).toHaveValue('61');
  await slider.press('ArrowLeft'); await expect(number).toHaveValue('60');
  await page.getByRole('button', { name: '增加 1 度', exact: true }).click(); await expect(number).toHaveValue('61');
  await page.getByRole('button', { name: '减少 1 度', exact: true }).click(); await expect(number).toHaveValue('60');
  await page.reload(); await expect(number).toHaveValue('60');
  await noAnswers(page);
  await number.fill(''); await expect(page.getByRole('button', { name: '第16题，未作答', exact: true })).toBeVisible();
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).answers.la16, key)).toBe('');
  await jump(page, 14); await expect(question(page).getByRole('img')).toHaveAccessibleDescription(/55.*125/); await expect(page.getByLabel('我的读数', { exact: true })).toHaveValue('55');
  await jump(page, 15); await expect(page.getByLabel('我的读数', { exact: true })).toHaveValue('75');
});

test('full core scores 100, extensions do not count, submission and reset require confirmation and remain isolated', async ({ page }) => {
  const original = '{"sentinel":"comprehensive record must survive"}';
  await page.addInitScript(({ k, raw }) => { if (!localStorage.getItem(k)) localStorage.setItem(k, raw); }, { k: comprehensiveKey, raw: original });
  await begin(page, true);
  for (let i = 0; i < bank.length; i++) {
    const q = bank[i]; await jump(page, i + 1);
    if (q.type === 'choice') await page.getByRole('radio', { name: `${String.fromCharCode(65 + q.options.indexOf(q.answer))} ${q.answer}`, exact: true }).check();
    else await page.getByLabel(q.interaction ? (q.interaction.mode === 'draw' ? '我画的角' : '我的读数') : '你的答案', { exact: !!q.interaction }).fill(q.bonus ? '999' : String(q.answer));
  }
  await page.getByRole('button', { name: '完成检查，准备交卷' }).click();
  await page.getByRole('button', { name: '继续检查', exact: true }).click(); await noAnswers(page);
  await page.getByRole('button', { name: '完成检查，准备交卷' }).click();
  await page.getByRole('button', { name: '确认交卷，查看讲解' }).click();
  await expect(page.locator('#result-title')).toHaveText(/^100\s*\/\s*100 分$/);
  await expect(page.getByText('正卷答对 20 / 20 题。', { exact: false })).toBeVisible();
  await expect(question(page).getByText('参考答案：195度')).toBeVisible();
  await jump(page, 1); await expect(page.getByRole('radio').first()).toBeDisabled();
  await jump(page, 16); await expect(page.getByLabel('我画的角', { exact: true })).toBeDisabled();
  const slider = page.getByRole('slider', { name: '调整所画角的角度', exact: true });
  await expect(slider).toHaveAttribute('aria-disabled', 'true');
  await page.reload(); await expect(page.locator('#result-title')).toHaveText(/^100\s*\/\s*100 分$/);
  await page.getByRole('button', { name: '重新开始这套练习' }).click();
  await page.getByRole('button', { name: '保留进度' }).click(); await expect(page.locator('#result-title')).toBeVisible();
  await page.getByRole('button', { name: '重新开始这套练习' }).click();
  await page.getByRole('button', { name: '确认重新开始' }).click();
  await expect(page.getByRole('button', { name: '开始练习 →' })).toBeVisible();
  const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  expect(saved.answers).toEqual({}); expect(saved.started).toBe(false); expect(saved.submitted).toBe(false);
  expect(await page.evaluate(k => localStorage.getItem(k), comprehensiveKey)).toBe(original);
});

test('malformed local progress is reported but not automatically overwritten on mount or reload', async ({ page }) => {
  for (const raw of ['{broken', JSON.stringify({ version: 1, answers: [], index: 0 })]) {
    await page.goto(path); await page.evaluate(({ k, raw }) => localStorage.setItem(k, raw), { k: key, raw });
    await page.reload(); await expect(page.getByRole('status')).toContainText('旧进度无法读取');
    expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(raw);
    await expect(page.getByRole('button', { name: '开始练习 →' })).toBeEnabled();
    await page.reload(); await expect(page.getByRole('status')).toContainText('旧进度无法读取');
    expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(raw);
  }
});
