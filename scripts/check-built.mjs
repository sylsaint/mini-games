import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import {businessRoutes,legacyAliases,maxPageBytes} from '@yoyo/config/site';
const routes=[...businessRoutes,'404'];
for(const route of routes){const html=await readFile(`dist/${route?route+'/':''}index.html`,'utf8');assert.match(html,/<html lang="zh-CN"/);assert.match(html,/_app\/immutable/);assert.ok(!html.includes('<iframe'));assert.ok(Buffer.byteLength(html)<maxPageBytes,`Oversize HTML ${route}`);}
for(const {from,to} of legacyAliases)assert.equal(await readFile(`dist${from}`,'utf8'),await readFile(`dist${to}index.html`,'utf8'));
assert.equal(await readFile('dist/404.html','utf8'),await readFile('dist/404/index.html','utf8'));
const guide=JSON.parse(await readFile('dist/travel/hunan/data/guide.json','utf8'));assert.ok(guide);
const resources=JSON.parse(await readFile('dist/resources.json','utf8'));assert.ok(resources.some(r=>r.url.includes('/_app/immutable/')));assert.ok(resources.some(r=>r.url.includes('/travel/hunan/assets/')));
console.log(`Verified ${routes.length} Svelte routes, old HTML aliases, content/assets and ${resources.length} hashed output resources.`);

const notFound=await readFile('dist/404.html','utf8');assert.doesNotMatch(notFound,/(?:href|src)="\.\.\//);assert.match(notFound,/\/[_]app\/immutable/);
