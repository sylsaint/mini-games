import {test,expect} from '@playwright/test';
for(const path of ['/not-a-real-yoyo-page/', '/learning/math/missing/deep/']) test(`unknown URL ${path} returns custom 404 and allows return home`,async({page})=>{
 const errors=[], assetFailures=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/_app/')&&r.status()>=400)assetFailures.push(r.url());});
 const response=await page.goto(path);
 expect(response.status()).toBe(404);
 await expect(page.getByRole('heading',{name:'这个角落还没放游戏。'})).toBeVisible();
 await expect(page.locator('.lost-page')).toHaveCSS('background-color','rgb(247, 246, 242)');
 expect(errors).toEqual([]);expect(assetFailures).toEqual([]);
 await page.getByRole('link',{name:'返回游戏大厅 ↗'}).click();
 await expect(page).toHaveURL(/\/$/);
 await expect(page.getByRole('heading',{name:'今天，玩点什么？'})).toBeVisible();
});
test('explicit old 404.html remains readable',async({page})=>{
 await page.goto('/404.html');
 await expect(page.getByRole('heading',{name:'这个角落还没放游戏。'})).toBeVisible();
});
