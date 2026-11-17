import { createHash } from 'node:crypto';
import { copyFile, writeFile, readFile } from 'node:fs/promises';
import { root } from './build.mjs';
import path from 'node:path';
for(const subject of ['math','chinese'])for(const page of ['report','practice'])await copyFile(path.join(root,`dist/learning/${subject}/${page}/index.html`),path.join(root,`dist/learning/${subject}/${page}.html`));
await writeFile(path.join(root,'dist/_redirects'),'/learning/chinese/report.html /learning/chinese/report/ 301\n/learning/chinese/practice.html /learning/chinese/practice/ 301\n/learning/math/report.html /learning/math/report/ 301\n/learning/math/practice.html /learning/math/practice/ 301\n');
console.log('Svelte site finalized with legacy URL aliases.');

const catalogPath=path.join(root,'dist/games.json'); const games=JSON.parse(await readFile(catalogPath,'utf8')); for(const game of games)game.entrySha256=createHash('sha256').update(await readFile(path.join(root,'dist',game.url))).digest('hex');await writeFile(catalogPath,JSON.stringify(games,null,2)+'\n');
// Capture the exact Svelte output so production checks include every hashed chunk.
const { readdir } = await import('node:fs/promises');
async function walk(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())result.push(...await walk(p));else result.push(p);}return result;}
const files=await walk(path.join(root,'dist'));
const manifest=[];for(const f of files){const url='/'+path.relative(path.join(root,'dist'),f).split(path.sep).join('/');if(url.startsWith('/_')&&!url.startsWith('/_app/'))continue;manifest.push({url,sha256:createHash('sha256').update(await readFile(f)).digest('hex')});}
await writeFile(path.join(root,'dist/resources.json'),JSON.stringify(manifest,null,2)+'\n');
