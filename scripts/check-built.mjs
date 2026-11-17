import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const routes=['','learning','learning/chinese','learning/math','learning/english','learning/science','learning/computing','learning/chinese/report','learning/chinese/practice','learning/math/report','learning/math/practice','travel/hunan','games/twenty-four'];
for(const route of routes){const html=await readFile(`dist/${route?route+'/':''}index.html`,'utf8');assert.match(html,/<html lang="zh-CN"/);assert.match(html,/_app\/immutable/);assert.ok(!html.includes('<iframe'));assert.ok(Buffer.byteLength(html)<300000,`Oversize HTML ${route}`);}
for(const subject of ['math','chinese'])for(const page of ['report','practice'])assert.equal(await readFile(`dist/learning/${subject}/${page}.html`,'utf8'),await readFile(`dist/learning/${subject}/${page}/index.html`,'utf8'));
const guide=JSON.parse(await readFile('dist/travel/hunan/data/guide.json','utf8'));assert.ok(guide);
const resources=JSON.parse(await readFile('dist/resources.json','utf8'));assert.ok(resources.some(r=>r.url.includes('/_app/immutable/')));assert.ok(resources.some(r=>r.url.includes('/travel/hunan/assets/')));
console.log(`Verified ${routes.length} Svelte routes, old HTML aliases, content/assets and ${resources.length} hashed output resources.`);
