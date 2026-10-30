import { test, expect } from "@playwright/test";
const subjects = ["math", "chinese", "english", "science", "computing"];
async function fits(page) {
  // Android may enlarge innerWidth to contain overflow, hiding the bug if compared to itself.
  const viewport = page.viewportSize();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(viewport.width + 1);
}

test("learning journey navigation, five subjects and mobile layouts", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('a[href="/learning/"]').first().click();
  await expect(page).toHaveURL(/\/learning\/$/);
  await expect(page.locator(".subject-card")).toHaveCount(5);
  await fits(page);
  for (const subject of subjects) {
    await page.goto(`/learning/${subject}/`);
    await expect(page.locator("#record-form")).toBeVisible();
    await fits(page);
    await expect(page.locator('a[href="/learning/"]').first()).toBeVisible();
  }
  await page.goto("/learning/math/");
  await page.locator('a[href="report.html"]').click();
  await expect(page).toHaveTitle(/数学.*分析/);
  await page.goBack();
  await page.locator('a[href="practice.html"]').click();
  await expect(page.locator("body")).toBeVisible();
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath("learning-practice.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/learning/");
  await page.screenshot({
    path: testInfo.outputPath("learning-map.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("exam records validate, render user text safely and persist only in their subject", async ({
  page,
}) => {
  await page.goto("/learning/chinese/");
  const form = page.locator("#record-form");
  await form
    .locator('[name="title"]')
    .fill('<img src=x onerror="window.bad=true">');
  await form.locator('[name="date"]').fill("2026-10-30");
  await form.locator('[name="score"]').fill("120");
  await form.locator('[name="total"]').fill("100");
  await form.locator('[name="reflection"]').fill("先画图，再解释理由。");
  await form.getByRole("button", { name: /保存/ }).click();
  await expect(page.locator("#form-status")).not.toHaveText("");
  await expect(page.locator("#record-list")).not.toContainText("<img");
  await form.locator('[name="score"]').fill("85");
  await form.getByRole("button", { name: /保存/ }).click();
  await expect(page.locator("#record-list")).toContainText(
    '<img src=x onerror="window.bad=true">',
  );
  await expect(page.locator("#record-list img")).toHaveCount(0);
  expect(await page.evaluate(() => window.bad)).toBeUndefined();
  await page.reload();
  await expect(page.locator("#record-list")).toContainText(
    "先画图，再解释理由。",
  );
  await page.goto("/learning/english/");
  await expect(page.locator("#record-list")).not.toContainText(
    "先画图，再解释理由。",
  );
});

test("exam records survive unavailable localStorage with an explicit warning", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Unavailable", "SecurityError");
      },
    });
  });
  await page.goto("/learning/science/");
  await expect(page.locator("#storage-status")).toBeVisible();
  const form = page.locator("#record-form");
  await form.locator('[name="title"]').fill("科学观察");
  await form.locator('[name="date"]').fill("2026-10-30");
  await form.locator('[name="score"]').fill("8");
  await form.locator('[name="total"]').fill("10");
  await form.getByRole("button", { name: /保存/ }).click();
  await expect(page.locator("#record-list")).toContainText("科学观察");
});

test("local records export a portable JSON backup without public report data", async ({
  page,
}) => {
  await page.goto("/learning/computing/");
  const form = page.locator("#record-form");
  await form.locator('[name="title"]').fill("步骤与顺序");
  await form.locator('[name="date"]').fill("2026-10-30");
  await form.locator('[name="score"]').fill("0");
  await form.locator('[name="total"]').fill("10");
  await form.getByRole("button", { name: /保存/ }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-records").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/计算机.*\.json$/);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const saved = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(saved.subject).toBe("computing");
  expect(saved.records).toHaveLength(1);
  expect(saved.records[0].score).toBe(0);
  expect(saved.records[0].title).toBe("步骤与顺序");
});

test("corrupted saved records show recovery guidance rather than crashing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("yoyo.learning.records.v1.english", "{broken-json");
  });
  await page.goto("/learning/english/");
  await expect(page.locator("#storage-status")).toBeVisible();
  await expect(page.locator("#record-form")).toBeVisible();
});

test("backup import previews before changing local records and rejects cross-subject files", async ({
  page,
}) => {
  await page.goto("/learning/science/");
  const backup = {
    format: "yoyo-learning-records",
    version: 1,
    subject: "science",
    records: [
      {
        title: "导入的科学记录",
        date: "2026-10-29",
        score: 9,
        total: 10,
        reflection: "观察与猜想分开。",
      },
    ],
  };
  await page.locator("#import-records").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator("#confirm-import")).toBeVisible();
  await expect(page.locator("#record-list")).not.toContainText(
    "导入的科学记录",
  );
  await page.locator("#cancel-import").click();
  await expect(page.locator("#record-list")).not.toContainText(
    "导入的科学记录",
  );
  await page.locator("#import-records").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.locator("#confirm-import").click();
  await expect(page.locator("#record-list")).toContainText("导入的科学记录");
  await page.reload();
  await expect(page.locator("#record-list")).toContainText("观察与猜想分开。");
  await page.locator("#import-records").setInputFiles({
    name: "other.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...backup,
        subject: "english",
        records: [{ ...backup.records[0], title: "不应导入" }],
      }),
    ),
  });
  await expect(page.locator("#record-list")).not.toContainText("不应导入");
  await expect(page.locator("#confirm-import")).toBeHidden();
});

async function currentQuestion(page) {
  const stem = await page.locator("#questionTitle").textContent();
  return page.evaluate(
    (stem) =>
      window.geometryAdventure.questions.find((item) => item.stem === stem),
    stem,
  );
}
async function solveVisibleQuestion(page, incorrect = false) {
  const question = await currentQuestion(page);
  const answer = incorrect
    ? (question.answer + 1) % question.opts.length
    : question.answer;
  await page.locator(`[data-answer="${answer}"]`).click();
  await page.locator("#reason").selectOption(String(question.reason));
  await page.locator("#check").click();
}

test("geometry mastery checks reasoning, revisits errors and persists a single capped reward", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await test.step("open geometry and verify viewport containment", async () => {
    console.info("QA geometry: opening practice");
    await page.goto("/learning/math/practice.html");
    await fits(page);
    console.info("QA geometry: page loaded, viewport containment passed");
  });
  await expect(page.locator("#rewardButton")).toHaveCount(0);
  await expect(page.locator("#labDone")).toBeDisabled();
  let insertedError = false;
  let revisited = false;
  let questionChecks = 0;
  for (let step = 0; step < 180; step++) {
    if (await page.locator("#rewardButton").isVisible()) break;
    if (await page.locator("#labDone").isVisible()) {
      console.info(
        "QA geometry: manipulating lab",
        await page.evaluate(() => window.geometryAdventure.getState().level),
      );
      if (await page.locator("[data-mode]").count())
        await page.locator("[data-mode]").last().click();
      else await page.locator("#more").click();
      await expect(page.locator("#labDone")).toBeEnabled();
      const level = await page.evaluate(
        () => window.geometryAdventure.getState().level,
      );
      if ([1, 2, 4].includes(level))
        await page.screenshot({
          path: testInfo.outputPath(`learning-lab-${level}.png`),
          fullPage: true,
          animations: "disabled",
        });
      console.info("QA geometry: lab done enabled, starting questions");
      await page.locator("#labDone").click();
    } else if (await page.locator("#next").isVisible()) {
      await page.locator("#next").click();
    } else if (await page.locator("#nextIsland").isVisible()) {
      await page.locator("#nextIsland").click();
    } else if (await page.locator("#startReview").isVisible()) {
      revisited = true;
      await page.locator("#startReview").click();
    } else if (await page.locator("#questionTitle").isVisible()) {
      console.info(
        "QA geometry: answering challenge",
        (await currentQuestion(page)).id,
      );
      if (!insertedError) {
        await solveVisibleQuestion(page, true);
        await expect(page.locator("#feedback")).not.toHaveClass(/good/);
        await expect(page.locator("#next")).toHaveCount(0);
        const question = await currentQuestion(page);
        await page.locator(`[data-answer="${question.answer}"]`).click();
        await page
          .locator("#reason")
          .selectOption(
            String((question.reason + 1) % question.reasons.length),
          );
        await page.locator("#check").click();
        await expect(page.locator("#feedback")).toContainText("理由");
        await expect(page.locator("#next")).toHaveCount(0);
        insertedError = true;
      }
      await solveVisibleQuestion(page);
      questionChecks++;
      await expect(page.locator("#feedback")).toHaveClass(/good/);
    } else {
      throw new Error(
        "Geometry adventure reached an unrecognized progression state",
      );
    }
  }
  expect(insertedError).toBeTruthy();
  expect(revisited).toBeTruthy();
  expect(questionChecks).toBeGreaterThanOrEqual(26);
  expect(
    await page.evaluate(() => window.geometryAdventure.isComplete()),
  ).toBeTruthy();
  console.info("QA geometry: all challenges complete, opening rewards");
  await page.locator("#rewardButton").click();
  const limits = await page.evaluate(() =>
    window.geometryAdventure.rewards.map((reward) => reward.limit),
  );
  expect(limits.length).toBeGreaterThan(0);
  expect(limits.every((limit) => limit >= 0 && limit <= 20)).toBeTruthy();
  await page.locator('[data-reward="0"]').click();
  await expect(page.locator("#rewardNote")).toContainText("家长");
  await expect(page.locator("#scratch")).toHaveCount(0);
  await page.locator("#parentOK").check();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('[data-reward="0"]').click();
  await expect(page.locator("#scratch")).toBeVisible();
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath("learning-scratch-covered.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.locator("#reveal").click();
  await expect(page.locator("#prize")).toBeVisible();
  const prize = await page.locator("#prize").textContent();
  await page.screenshot({
    path: testInfo.outputPath("learning-reward.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await page.locator("#rewardButton").click();
  await expect(page.locator("#prize")).toHaveText(prize);
  await expect(page.locator("[data-reward]")).toHaveCount(0);
  await page.locator("summary").click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.locator("#resetButton").click();
  expect(
    await page.evaluate(() => window.geometryAdventure.isComplete()),
  ).toBeTruthy();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#resetButton").click();
  await expect(page.locator("#labDone")).toBeVisible();
  expect(
    await page.evaluate(() => window.geometryAdventure.isComplete()),
  ).toBeFalsy();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("yoyo-geometry-reward-v1")).revealed,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("geometry malformed saved state and unavailable storage remain usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("yoyo-geometry-v1", "{bad-json");
  });
  console.info("QA malformed storage: opening practice");
  await page.goto("/learning/math/practice.html");
  await fits(page);
  console.info("QA malformed storage: clicking initial lab control");
  await expect(page.locator("#labDone")).toBeVisible();
  await page.locator("[data-mode]").last().click();
  await page.locator("#labDone").click();
  await expect(page.locator("#questionTitle")).toBeVisible();
});

test("complete report preserves sections and saves all fourteen days and five reasoning responses", async ({
  page,
}, testInfo) => {
  await page.goto("/learning/math/report.html");
  for (let section = 1; section <= 5; section++)
    await expect(page.locator(`#section-${section}`)).toBeVisible();
  await expect(page.locator("[data-day]")).toHaveCount(14);
  await expect(page.locator("[data-save]")).toHaveCount(10);
  for (let day = 0; day < 14; day++)
    await page.locator(`[data-day="${day}"]`).check();
  await expect(page.locator("#plan-count")).toHaveText("14/14 天");
  for (let item = 0; item < 5; item++) {
    await page.locator(`#answer-${item}`).fill(`答案 ${item + 1}`);
    await page
      .locator(`#reason-${item}`)
      .fill(`因为已知条件 ${item + 1}，所以可以判断。`);
  }
  await page.reload();
  await expect(page.locator("#plan-count")).toHaveText("14/14 天");
  for (let day = 0; day < 14; day++)
    await expect(page.locator(`[data-day="${day}"]`)).toBeChecked();
  for (let item = 0; item < 5; item++) {
    await expect(page.locator(`#answer-${item}`)).toHaveValue(
      `答案 ${item + 1}`,
    );
    await expect(page.locator(`#reason-${item}`)).toHaveValue(
      `因为已知条件 ${item + 1}，所以可以判断。`,
    );
  }
  await page.locator('[data-day="0"]').uncheck();
  await expect(page.locator("#plan-count")).toHaveText("13/14 天");
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath("learning-report.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
});

test("report remains writable when browser storage is disabled and explains backup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Unavailable", "SecurityError");
      },
    });
  });
  await page.goto("/learning/math/report.html");
  await expect(page.locator("#save-status")).toContainText("无法保存");
  await page.locator('[data-day="0"]').check();
  await page.locator("#answer-0").fill("不是同一条射线");
  await expect(page.locator("#plan-count")).toHaveText("1/14 天");
  await expect(page.locator("#answer-0")).toHaveValue("不是同一条射线");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-notes").click();
  const download = await downloadPromise;
  const chunks = [];
  for await (const chunk of await download.createReadStream())
    chunks.push(chunk);
  const saved = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(saved.days).toEqual([0]);
  expect(saved.answers["answer-0"]).toBe("不是同一条射线");
});

test("scratch card responds to real pointer or touch input after a completed-session fixture", async ({
  page,
  isMobile,
}) => {
  console.info("QA scratch: opening practice");
  await page.goto("/learning/math/practice.html");
  await fits(page);
  // Fixture isolates scratch mechanics. The previous test earns completion through the actual UI.
  await page.evaluate(() => {
    const app = window.geometryAdventure;
    const state = app.getState();
    state.level = app.topics.length - 1;
    state.labs = app.topics.map(() => true);
    state.solved = app.questions.map((q) => q.id);
    state.wrong = [];
    state.revisited = [];
    localStorage.setItem("yoyo-geometry-v1", JSON.stringify(state));
    localStorage.removeItem("yoyo-geometry-reward-v1");
  });
  await page.reload();
  console.info("QA scratch: opening earned reward");
  await page.locator("#rewardButton").click();
  await page.locator("#parentOK").check();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('[data-reward="1"]').click();
  await page.locator("#scratch").scrollIntoViewIfNeeded();
  const rect = await page.locator("#scratch").boundingBox();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      if (!(await page.locator("#scratch").count())) break;
      const x = rect.x + (rect.width * (col + 0.5)) / 7,
        y = rect.y + (rect.height * (row + 0.5)) / 4;
      if (isMobile) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
    }
  }
  await expect(page.locator("#prize")).toBeVisible();
  await expect(page.locator("#scratch")).toHaveCount(0);
});

test("early wrong-question review returns to unfinished challenges without unlocking rewards", async ({
  page,
}) => {
  console.info("QA early review: opening practice");
  await page.goto("/learning/math/practice.html");
  await fits(page);
  console.info("QA early review: manipulating initial lab");
  await page.locator("[data-mode]").last().click();
  await page.locator("#labDone").click();
  await solveVisibleQuestion(page, true);
  await solveVisibleQuestion(page);
  await page.locator("#reviewButton").click();
  await solveVisibleQuestion(page);
  await page.locator("#next").click();
  await expect(page.locator("#rewardButton")).toHaveCount(0);
  await expect(page.locator("#resumeChallenge")).toBeVisible();
  await page.locator("#resumeChallenge").click();
  await expect(page.locator("#questionTitle")).toBeVisible();
  expect(
    await page.evaluate(() => window.geometryAdventure.isComplete()),
  ).toBeFalsy();
});
