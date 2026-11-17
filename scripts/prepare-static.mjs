import { cp, mkdir, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { root, scanGames } from './build.mjs';
const out=path.join(root,'apps/web/static');
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
const games=await scanGames(path.join(root,'games'));
await writeFile(path.join(out,'games.json'),JSON.stringify(games,null,2)+'\n');
for(const game of games){const cover=path.join(out,game.cover);await mkdir(path.dirname(cover),{recursive:true});await cp(path.join(root,'games',game.id,path.basename(game.cover)),cover);}
for(const name of ['assets','data']){const src=path.join(root,'packages/travel',name);if(await access(src).then(()=>true,()=>false))await cp(src,path.join(out,'travel/hunan',name),{recursive:true});}
await writeFile(path.join(out,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n');
await writeFile(path.join(out,'build.json'),JSON.stringify({sourceCommit:process.env.GITHUB_SHA||'local',builtAt:new Date().toISOString()},null,2)+'\n');

await cp(path.join(root,'games/twenty-four/index.html'),path.join(out,'games/twenty-four/offline.html'));
