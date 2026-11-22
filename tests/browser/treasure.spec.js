import { test, expect } from "@playwright/test";

const route = "/games/mawangdui-treasure/";
const toolNames = ["light", "hem", "seal"];

test("the lobby keeps both Mawangdui games distinct", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /逃出马王堆/ })).toHaveAttribute(
    "href",
    /escape-mawangdui/,
  );
  await page.getByRole("link", { name: /马王堆寻宝/ }).click();
  await expect(page).toHaveURL(new RegExp(route + "$"));
  await expect(page.getByTestId("treasure-start")).toBeEnabled();
  await page.goBack();
  await expect(page.getByRole("link", { name: /马王堆寻宝/ })).toBeVisible();
});

test("build a case from independent evidence, bracket a weight, restore a weave and reopen the exhibit", async ({
  page,
  isMobile,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const el = (id) => page.getByTestId(id);
  const press = (id) => (isMobile ? el(id).tap() : el(id).click());
  const rangeToEnd = async (id) => {
    const slider = el(id);
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    const at = { x: box.width - 12, y: box.height / 2 };
    if (isMobile) await slider.tap({ position: at });
    else await slider.click({ position: at });
    await expect
      .poll(async () => Number(await slider.inputValue()))
      .toBeGreaterThanOrEqual(85);
  };
  const fits = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  const observe = async (index) => {
    await press("investigate-bundle-" + index);
    for (const kind of toolNames) {
      await press("investigate-tool-" + kind);
      await rangeToEnd("investigate-tool-control");
      await expect(el("investigate-observation")).toBeVisible();
      await press("investigate-pin-" + kind);
    }
  };
  const weigh = async (values) => {
    if (await el("lab-reset").isEnabled()) await press("lab-reset");
    for (const value of values) await press("lab-weight-" + value);
    await press("lab-test");
  };

  await page.goto(route);
  await press("treasure-start");
  await fits();
  await press("investigate-bundle-2");
  await expect(el("investigate-submit")).toBeDisabled();
  await expect(el("investigate-pin-seal")).toBeDisabled();
  await press("investigate-archive");
  for (const kind of toolNames) {
    await press("investigate-reference-" + kind);
    await rangeToEnd("investigate-reference-control");
    await expect(el("investigate-reference-result")).toBeVisible();
  }
  await press("investigate-field");
  await observe(0);
  await press("investigate-submit");
  await expect(el("investigate-feedback")).toContainText("闭合圈");
  await observe(2);
  await page.screenshot({
    path: testInfo.outputPath("casework-evidence.png"),
    fullPage: true,
    animations: "disabled",
  });
  await press("investigate-submit");
  await expect(el("lab-test")).toBeVisible();

  // A balanced result alone is not enough evidence to complete the measurement.
  await weigh([30, 15, 4]);
  await expect(el("lab-result")).toContainText("齐平");
  await expect(el("lab-finish")).toBeDisabled();
  await weigh([30, 15, 2, 1]);
  await expect(el("lab-result")).toContainText("左盘下沉");
  await expect(el("lab-finish")).toBeDisabled();
  await weigh([30, 15, 4, 2]);
  await expect(el("lab-result")).toContainText("右盘下沉");
  await expect(el("lab-finish")).toBeEnabled();
  await fits();
  await press("lab-finish");
  await expect(el("restore-check")).toBeVisible();

  // Working evidence from completed stages survives leaving the page.
  await page.reload();
  await expect(el("treasure-start")).toContainText("继续调查");
  await press("treasure-start");
  await press("restore-check");
  await expect(page.getByRole("status")).toContainText("线型对不上");
  await press("restore-rotate");
  await press("restore-check");
  await expect(page.getByRole("status")).toContainText("线头还没接上");
  // Zero default offset, thirteen arrow steps move the right sample down 13.
  const slider = el("restore-offset");
  await slider.focus();
  for (let i = 0; i < 13; i++) await slider.press("ArrowRight");
  await expect(slider).toHaveValue("13");
  await press("restore-check");
  await press("restore-claim-0");
  await press("restore-claim-1");
  await press("restore-file");
  await expect(page.getByRole("status")).toContainText("比证据更多");
  await press("restore-claim-1");
  await press("restore-claim-2");
  await press("restore-file");
  await expect(el("treasure-complete")).toContainText("直裾素纱单衣");
  await fits();
  await page.screenshot({
    path: testInfo.outputPath("casework-exhibit.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await expect(el("treasure-start")).toContainText("展柜");
  await press("treasure-start");
  await expect(el("treasure-complete")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the rare shelf find does not unlock the solution", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto(route);
  await page.getByTestId("treasure-start").click();
  await page.getByTestId("investigate-shelf").click();
  await expect(page.getByTestId("investigate-detour")).toContainText(
    "备用印记拓片",
  );
  await expect(page.getByTestId("investigate-shelf")).toBeDisabled();
  await page.getByTestId("investigate-bundle-2").click();
  await expect(page.getByTestId("investigate-submit")).toBeDisabled();
  await expect(page.getByTestId("investigate-pin-seal")).toBeDisabled();
});
