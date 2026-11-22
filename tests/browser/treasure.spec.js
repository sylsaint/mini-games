import { test, expect } from "@playwright/test";

const route = "/games/mawangdui-treasure/";

test("the lobby lists the new case as a separate game", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /逃出马王堆/ })).toHaveAttribute(
    "href",
    /escape-mawangdui/,
  );
  await page.getByRole("link", { name: /马王堆寻宝/ }).click();
  await expect(page).toHaveURL(new RegExp(route + "$"));
  await expect(page.getByTestId("treasure-start")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("link", { name: /马王堆寻宝/ })).toBeVisible();
});

test("solve the silk case, recover from wrong guesses and reopen the exhibit", async ({
  page,
  isMobile,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const button = (id) => page.getByTestId("treasure-" + id);
  const press = (id) => (isMobile ? button(id).tap() : button(id).click());
  const fits = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);

  await page.goto(route);
  await press("start");
  await fits();
  await expect(button("excavate")).toBeDisabled();
  await press("corner-2");
  await expect(button("clue")).toContainText("弯弯");
  await press("excavate");
  await expect(
    page.getByRole("status").filter({ hasText: "找到一小片薄纱" }),
  ).toBeVisible();
  await expect(button("excavate")).toBeDisabled();
  await press("corner-1");
  await expect(button("clue")).toContainText("直直的衣襟");
  await page.screenshot({
    path: testInfo.outputPath("treasure-field.png"),
    fullPage: true,
    animations: "disabled",
  });
  await press("excavate");
  await fits();
  await expect(button("weigh-next")).toBeDisabled();
  await press("weight-50");
  await expect(button("scale-result")).toContainText("长衣比 50 克轻");
  await press("clear");
  await press("weight-40");
  await expect(button("scale-result")).toContainText("长衣比 40 克重");
  await press("weight-9");
  await expect(button("scale-result")).toContainText("两边平衡");
  await press("weigh-next");
  await fits();
  await button("overlay").focus();
  await button("overlay").press("ArrowRight");
  await expect(button("overlay")).not.toHaveValue("0");
  await press("label-1");
  await press("display");
  await expect(
    page.getByRole("status").filter({ hasText: "再看看" }),
  ).toBeVisible();
  await press("label-0");
  await press("display");
  await expect(button("complete")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("treasure-exhibit.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await page.getByRole("button", { name: "查看我布置的展柜" }).click();
  await expect(button("complete")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the rare bonus is a voluntary shortcut, not a random main-case gate", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto(route);
  await page.getByTestId("treasure-start").click();
  await page.getByTestId("treasure-explore").click();
  await expect(page.getByTestId("treasure-scale")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "额外发现" }),
  ).toBeVisible();
});

test("moving the light investigates a soil spot and dragging weighs the robe", async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    "Physical mouse drag; phone profiles exercise tap controls and the slider above.",
  );
  await page.goto(route);
  await page.getByTestId("treasure-start").click();
  const field = page.getByTestId("treasure-lamp-field");
  await field.scrollIntoViewIfNeeded();
  const f = await field.boundingBox();
  await page.mouse.move(f.x + f.width * 0.4, f.y + f.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(f.x + f.width * 0.5, f.y + f.height * 0.51, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.getByTestId("treasure-clue")).toContainText("直直的衣襟");
  await page.getByTestId("treasure-excavate").click();
  const weight = page.getByTestId("treasure-weight-50");
  const pan = page.getByTestId("treasure-pan");
  await weight.scrollIntoViewIfNeeded();
  const from = await weight.boundingBox();
  const to = await pan.boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(weight).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("treasure-scale-result")).toContainText(
    "长衣比 50 克轻",
  );
});
