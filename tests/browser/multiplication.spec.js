import { test, expect } from "@playwright/test";
const route = "/learning/math/integer-multiplication/";
const jump = (page, n) =>
  page.getByRole("button", { name: new RegExp(`^第 ${n} 题，`) }).click();
const submit = async (page) => {
  await page.getByRole("button", { name: "交卷评分", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "确认交卷", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "我的答题报告" }),
  ).toBeVisible();
};

test("math hub links to both papers; wrong parts explain place value only after submitting", async ({
  page,
}) => {
  await page.goto("/learning/math/");
  await page.getByRole("link", { name: /打开第三单元两套试卷/ }).click();
  await expect(page).toHaveURL(new RegExp(route + "$"));
  await page.getByRole("button", { name: "开始 A 卷" }).click();
  await jump(page, 3);
  await page.getByRole("button", { name: "左上", exact: true }).click();
  await expect(page.getByText("30 列 × 20 排", { exact: true })).toBeVisible();
  await expect(page.getByText(/正确答案：|＝ 600 人/)).toHaveCount(0);
  await jump(page, 4);
  await page.getByLabel("236 × 4", { exact: true }).fill("９４４");
  await page.getByLabel("236 × 30", { exact: true }).fill("708");
  await page.getByLabel("两个部分积的和", { exact: true }).fill("8,024");
  await page.getByRole("radio", { name: "乘的是 3 个十" }).check();
  await expect(page.getByText("已填完 1 / 15 题")).toBeVisible();
  await page.getByRole("button", { name: "交卷评分", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("14 题没有填完整");
  await page.getByRole("button", { name: "返回检查" }).click();
  await expect(page.getByText("正确答案：", { exact: false })).toHaveCount(0);
  await submit(page);
  await expect(page.locator(".score")).toHaveText("6");
  await page.locator("summary").filter({ hasText: "拼回完整的积" }).click();
  await expect(
    page.getByText("708 只是 236 × 3。十位上的 3 表示 30。", { exact: true }),
  ).toBeVisible();
});

test("calculator does not fill an answer; navigating, resetting, and refreshing preserve separate papers", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "开始 B 卷" }).click();
  await jump(page, 9);
  for (const key of ["3", "7", "6", "4", "8", "×", "2", "9", "="])
    await page.getByRole("button", { name: key, exact: true }).click();
  await expect(page.getByLabel("计算器显示", { exact: true })).toHaveText(
    "1091792",
  );
  await expect(page.getByLabel("正确的积", { exact: true })).toHaveValue("");
  await page.getByLabel("正确的积", { exact: true }).fill("1091792");
  await jump(page, 11);
  await expect(page.getByRole("img", { name: /座位图/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.reload();
  await page.getByRole("button", { name: "继续 B 卷" }).click();
  await expect(
    page.getByRole("heading", { name: "封闭区不能安排人" }),
  ).toBeVisible();
  await jump(page, 9);
  await expect(page.getByLabel("正确的积", { exact: true })).toHaveValue(
    "1091792",
  );
  await submit(page);
  await expect(page.locator(".score")).toHaveText("3");
  await page.getByRole("button", { name: "去 A 卷" }).click();
  await expect(page.getByLabel("积", { exact: true })).toHaveValue("");
  await submit(page);
  await page.getByRole("button", { name: "清除本卷并重做" }).click();
  await page.getByRole("button", { name: "清除并重做" }).click();
  await page.getByRole("button", { name: "返回选卷" }).click();
  await page.getByRole("button", { name: "查看 B 卷成绩" }).click();
  await expect(page.locator(".score")).toHaveText("3");
});
