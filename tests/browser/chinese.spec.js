import { test, expect } from "@playwright/test";

async function fits(page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize().width + 1);
}
const reportPath = "/learning/chinese/report.html";
const practicePath = "/learning/chinese/practice.html";

test("Chinese subject links reach report, practice and canonical learning home", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/learning/");
  await page.locator('a[href="/learning/chinese/"]').click();
  await expect(page.locator("#record-form")).toBeVisible();
  await page.locator(`a[href="${reportPath}"]`).first().click();
  await expect(page).toHaveTitle(/语文.*分析/);
  await fits(page);
  await page.locator('a[href="/learning/"]').last().click();
  await expect(page).toHaveURL(/\/learning\/$/);
  await page.goto("/learning/chinese/");
  await page.locator(`a[href="${practicePath}"]`).first().click();
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath("chinese-practice-start.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  await page.locator('a[href="/learning/"]').last().click();
  await expect(page).toHaveURL(/\/learning\/$/);
  expect(errors).toEqual([]);
});

test("Chinese report preserves all fourteen days and five private notes across reload", async ({
  page,
}, testInfo) => {
  await page.goto(reportPath);
  await expect(page.locator("[data-day]")).toHaveCount(14);
  await expect(page.locator("[data-save]")).toHaveCount(5);
  for (let day = 0; day < 14; day++)
    await page.locator(`[data-day="${day}"]`).check();
  for (let n = 0; n < 5; n++)
    await page
      .locator(`#answer-${n}`)
      .fill(`第 ${n + 1} 个理由：先找原文依据，再解释。`);
  await expect(page.locator("#plan-count")).toHaveText("14/14 天");
  await page.reload();
  for (let day = 0; day < 14; day++)
    await expect(page.locator(`[data-day="${day}"]`)).toBeChecked();
  for (let n = 0; n < 5; n++)
    await expect(page.locator(`#answer-${n}`)).toHaveValue(
      `第 ${n + 1} 个理由：先找原文依据，再解释。`,
    );
  await page.locator('[data-day="0"]').uncheck();
  await expect(page.locator("#plan-count")).toHaveText("13/14 天");
  await expect(page.locator("body")).toContainText("不是自动评分");
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath("chinese-report.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  await page.goto("/learning/math/report.html");
  await expect(page.locator("#plan-count")).toHaveText("0/14 天");
  await expect(page.locator("#answer-0")).toHaveValue("");
});

test("Chinese report handles blocked storage and exports its in-memory notes", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Unavailable", "SecurityError");
      },
    }),
  );
  await page.goto(reportPath);
  await expect(page.locator("#save-status")).toContainText("无法保存");
  await page.locator('[data-day="2"]').check();
  await page.locator("#answer-0").fill("这是我找到的依据。");
  await expect(page.locator("#plan-count")).toHaveText("1/14 天");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-notes").click();
  const download = await downloadPromise;
  const chunks = [];
  for await (const chunk of await download.createReadStream())
    chunks.push(chunk);
  const saved = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(saved.days).toEqual([2]);
  expect(saved.answers["answer-0"]).toBe("这是我找到的依据。");
});

test("Chinese report recovers malformed notes without rendering injected markup", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("yoyo-chinese-report-v1", "{bad-json"),
  );
  await page.goto(reportPath);
  await expect(page.locator("#save-status")).toContainText("损坏");
  await page
    .locator("#answer-0")
    .fill('<img src=x onerror="window.injected=true">');
  await expect(page.locator("#answer-0")).toHaveValue(
    '<img src=x onerror="window.injected=true">',
  );
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

async function solveLab(page) {
  const expected = await page.evaluate(() => {
    const app = window.chineseAdventure;
    return app.topics[app.getState().level].evidence;
  });
  for (const index of expected)
    await page.locator(`[data-evidence="${index}"]`).click();
  await page.locator("#labCheck").click();
  await expect(page.locator("#labFeedback")).toHaveClass(/good/);
  await page.locator("#labDone").click();
}
async function question(page) {
  const stem = await page.locator("#questionTitle").textContent();
  return page.evaluate(
    (stem) => window.chineseAdventure.questions.find((q) => q.stem === stem),
    stem,
  );
}
async function solve(page) {
  const q = await question(page);
  if (q.kind === "single")
    await page.locator(`[data-answer="${q.answer}"]`).click();
  else if (q.kind === "order")
    for (const i of q.answer) await page.locator(`[data-piece="${i}"]`).click();
  else {
    for (const selected of await page
      .locator('[data-answer][aria-pressed="true"]')
      .all())
      await selected.click();
    for (const i of q.answer)
      await page.locator(`[data-answer="${i}"]`).click();
  }
  await page.locator("#check").click();
  await expect(page.locator("#feedback")).toHaveClass(/good/);
  await expect(page.locator("#feedback")).toContainText(q.explain);
}

test("Chinese full journey earns one capped reward only after objective challenges and error review", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(practicePath);
  await fits(page);
  await expect(page.locator("#rewardButton")).toHaveCount(0);
  await expect(page.locator("#labDone")).toBeHidden();
  await page.locator("#labCheck").click();
  await expect(page.locator("#labDone")).toBeHidden();
  let inserted = false,
    reviewed = false,
    solved = 0;
  const kinds = new Set();
  for (let step = 0; step < 160; step++) {
    if (await page.locator("#rewardButton").isVisible()) break;
    if (await page.locator("#labCheck").isVisible()) await solveLab(page);
    else if (await page.locator("#next").isVisible())
      await page.locator("#next").click();
    else if (await page.locator("#nextIsland").isVisible())
      await page.locator("#nextIsland").click();
    else if (await page.locator("#startReview").isVisible()) {
      reviewed = true;
      await page.locator("#startReview").click();
    } else if (await page.locator("#questionTitle").isVisible()) {
      const q = await question(page);
      kinds.add(q.kind);
      if (!inserted) {
        await page.locator("#hintButton").click();
        await expect(page.locator("#hint")).toContainText(q.hint);
        await page
          .locator(`[data-answer="${(q.answer + 1) % q.opts.length}"]`)
          .click();
        await page.locator("#check").click();
        await expect(page.locator("#feedback")).not.toHaveClass(/good/);
        await expect(page.locator("#next")).toHaveCount(0);
        inserted = true;
      }
      await solve(page);
      solved++;
    } else throw Error("Unrecognized Chinese progression state");
  }
  expect(inserted && reviewed).toBeTruthy();
  expect(solved).toBe(31);
  expect([...kinds].sort()).toEqual(["evidence", "order", "single"]);
  const state = await page.evaluate(() => window.chineseAdventure.getState());
  expect(state.solved).toHaveLength(30);
  expect(state.revisited).toEqual([0]);
  expect(state.hintsUsed).toEqual([0]);
  expect(
    await page.evaluate(() => window.chineseAdventure.isComplete()),
  ).toBeTruthy();
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath("chinese-completion.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  await page.locator("#rewardButton").click();
  expect(
    await page.evaluate(() =>
      window.chineseAdventure.rewards.every(
        (r) => r.limit >= 0 && r.limit <= 20,
      ),
    ),
  ).toBeTruthy();
  await page.locator('[data-reward="3"]').click();
  await expect(page.locator("#rewardNote")).toContainText("家长");
  await expect(page.locator("#scratch")).toHaveCount(0);
  await page.locator("#parentOK").check();
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-reward="3"]').click();
  await expect(page.locator("#scratch")).toBeVisible();
  await page.locator("#reveal").click();
  await expect(page.locator("#prize")).toHaveAttribute("aria-hidden", "false");
  const prize = await page.locator("#prize").textContent();
  await page.reload();
  await page.locator("#rewardButton").click();
  await expect(page.locator("#prize")).toHaveText(prize);
  await expect(page.locator("[data-reward]")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("chinese-reward.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  await page.getByText("家长小角落：怎么用才有帮助？", { exact: true }).click();
  page.once("dialog", (d) => d.dismiss());
  await page.locator("#resetButton").click();
  expect(
    await page.evaluate(() => window.chineseAdventure.isComplete()),
  ).toBeTruthy();
  page.once("dialog", (d) => d.accept());
  await page.locator("#resetButton").click();
  expect(
    await page.evaluate(() => window.chineseAdventure.isComplete()),
  ).toBeFalsy();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("yoyo-chinese-reward-v1")),
    ),
  ).toEqual({ choice: 3, revealed: true });
  await expect(page.locator("#labCheck")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Chinese writing stays optional and private without semantic auto-grading", async ({
  page,
}) => {
  await page.goto(practicePath);
  await page.locator(".notebook > summary").click();
  await page
    .locator("#writing")
    .fill("我想推荐校园的小花园。<img src=x onerror=window.bad=true>");
  await page.locator(".selfcheck").first().check();
  await expect(page.locator("#writingStatus")).toContainText("没有自动评分");
  expect(
    await page.evaluate(() => window.chineseAdventure.getState().solved),
  ).toEqual([]);
  await page.reload();
  await page.locator(".notebook > summary").click();
  await expect(page.locator("#writing")).toHaveValue(
    "我想推荐校园的小花园。<img src=x onerror=window.bad=true>",
  );
  await expect(page.locator(".selfcheck").first()).toBeChecked();
  expect(await page.evaluate(() => window.bad)).toBeUndefined();
});

test("Chinese game survives malformed storage and early error review does not unlock reward", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("yoyo-chinese-v1", "{bad"),
  );
  await page.goto(practicePath);
  await expect(page.locator("#storageNotice")).toBeVisible();
  await solveLab(page);
  const q = await question(page);
  await page
    .locator(`[data-answer="${(q.answer + 1) % q.opts.length}"]`)
    .click();
  await page.locator("#check").click();
  await solve(page);
  await page.locator("#reviewButton").click();
  await solve(page);
  await page.locator("#next").click();
  await expect(page.locator("#rewardButton")).toHaveCount(0);
  await page.locator("#resumeChallenge").click();
  await expect(page.locator("#questionTitle")).toBeVisible();
  expect(
    await page.evaluate(() => window.chineseAdventure.isComplete()),
  ).toBeFalsy();
});

test("Chinese game blocked storage remains playable and warns before losing written work", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Unavailable", "SecurityError");
      },
    }),
  );
  await page.goto(practicePath);
  await expect(page.locator("#storageNotice")).toBeVisible();
  await solveLab(page);
  await solve(page);
  await fits(page);
  await page.locator(".notebook > summary").click();
  await page.locator("#writing").fill("先在纸上记录。");
  await expect(page.locator("#writingStatus")).toContainText("无法保存");
});

test("Chinese earned scratch card responds to actual pointer or touch input", async ({
  page,
  isMobile,
}) => {
  await page.goto(practicePath);
  await page.evaluate(() => {
    const app = window.chineseAdventure,
      s = app.getState();
    s.level = 5;
    s.labs = app.topics.map(() => true);
    s.solved = app.questions.map((q) => q.id);
    localStorage.setItem("yoyo-chinese-v1", JSON.stringify(s));
  });
  await page.reload();
  await page.locator("#rewardButton").click();
  await page.locator("#parentOK").check();
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-reward="1"]').click();
  await page.locator("#scratch").scrollIntoViewIfNeeded();
  const rect = await page.locator("#scratch").boundingBox();
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 7; c++) {
      if (!(await page.locator("#scratch").count())) break;
      const x = rect.x + (rect.width * (c + 0.5)) / 7,
        y = rect.y + (rect.height * (r + 0.5)) / 4;
      if (isMobile) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
    }
  await expect(page.locator("#scratch")).toHaveCount(0);
  await expect(page.locator("#prize")).toHaveAttribute("aria-hidden", "false");
});
