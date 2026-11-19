import {test,expect} from '@playwright/test';
const path='/learning/math/grade-four-fall/';
test('math exam supports skip, save, reload, submit and reset without early answers',async({page})=>{
 await page.goto(path);await page.getByRole('button',{name:'开始练习 →'}).click();
 await expect(page.getByText('参考答案：',{exact:false})).toHaveCount(0);
 await page.getByRole('radio',{name:'C 8000 次'}).check();
 await page.getByRole('button',{name:'下一题 →'}).click();await page.getByRole('button',{name:'先跳过 →'}).click();
 await page.reload();await expect(page.getByRole('heading',{name:/一块长方形/})).toBeVisible();
 await page.getByRole('button',{name:'第1题，已作答',exact:true}).click();await expect(page.getByRole('radio',{name:'C 8000 次'})).toBeChecked();
 await page.getByRole('button',{name:'完成检查，准备交卷'}).click();await page.getByRole('button',{name:'继续检查'}).click();await expect(page.getByText('参考答案：',{exact:false})).toHaveCount(0);
 await page.getByRole('button',{name:'完成检查，准备交卷'}).click();await page.getByRole('button',{name:'确认交卷，查看讲解'}).click();await expect(page.getByText('正卷答对 1 / 15 题。',{exact:false})).toBeVisible();await expect(page.getByRole('radio').first()).toBeDisabled();
 await page.reload();await expect(page.getByText('参考答案：8000 次')).toBeVisible();
 await page.getByRole('button',{name:'重新开始这套练习'}).click();await page.getByRole('button',{name:'保留进度'}).click();await expect(page.getByText('参考答案：8000 次')).toBeVisible();
 await page.getByRole('button',{name:'重新开始这套练习'}).click();await page.getByRole('button',{name:'确认重新开始'}).click();await expect(page.getByRole('button',{name:'开始练习 →'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('optional questions and accessible data table are available',async({page})=>{await page.goto(path);await page.getByRole('checkbox').check();await page.getByRole('button',{name:'开始练习 →'}).click();await expect(page.getByRole('button',{name:'第18题，选做，未作答'})).toBeVisible();await page.getByRole('button',{name:'第14题，未作答'}).click();await expect(page.getByRole('table')).toBeVisible();await page.getByLabel('你的答案').fill('19');await page.screenshot({path:`test-results/math-exam-${test.info().project.name}.png`,fullPage:true});});
