import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const base=new URL(process.env.BASE_URL);if(base.protocol!=='https:'||!base.hostname.endsWith('.pages.dev')||base.username||base.password)throw Error('Invalid Pages origin');
const expected=process.env.EXPECTED_COMMIT;if(!/^[a-f0-9]{40}$/.test(expected||''))throw Error('Expected commit required');
const meta=await fetch(new URL('/build.json?commit='+expected,base)).then(r=>r.json());if(meta.sourceCommit!==expected)throw Error('Wrong deployed revision');
const manifest=JSON.parse(await readFile('dist/resources.json','utf8'));
if(manifest.length>500)throw Error('Unexpected resource count');
let count=0;for(const item of manifest){const url=new URL(item.url,base);if(url.origin!==base.origin)throw Error('Cross-origin resource');url.searchParams.set('commit',expected);const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`HTTP ${r.status} ${item.url}`);const hash=createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');if(hash!==item.sha256)throw Error('Resource mismatch '+item.url);count++;}
console.log(`Verified ${count} exact deployed Svelte resources for ${expected}.`);
