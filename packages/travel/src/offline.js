// This module and the self-contained export runtime are fetched only on explicit download.
import template from '../offline/template.html?raw';
import app from '../offline/app.js?raw';
import speech from '../../speech/src/index.js?raw';
import css from '../offline/styles.css?raw';
const toDataURL = blob => new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});
export async function createOfflineHTML(data){
 const images=await Promise.all(data.photos.map(async p=>{const r=await fetch(p.src);if(!r.ok)throw Error('Image download failed');return toDataURL(await r.blob());}));
 const snapshot=structuredClone(data),urls=new Map();snapshot.photos.forEach((p,i)=>{urls.set(p.src,images[i]);p.src=images[i];});
 const doc=new DOMParser().parseFromString(template,'text/html');
 doc.querySelectorAll('script, #load-status, link[rel="stylesheet"]').forEach(el=>el.remove());
 const style=doc.createElement('style');style.textContent=css;doc.head.append(style);
 doc.querySelectorAll('img').forEach(img=>{const src=img.getAttribute('src');if(urls.has(src))img.src=urls.get(src);});
 const content=doc.createElement('script');content.type='application/json';content.id='guide-data';content.textContent=JSON.stringify(snapshot).replace(/</g,'\\u003c');doc.body.append(content);
 const runtime=doc.createElement('script');runtime.textContent=speech.replaceAll('export function ','function ')+'\n'+app.replace(/import \{ createSpeechController \} from "\.\/speech\.js";\s*/,'').replace('export function initGuide','function initGuide')+'\ninitGuide(JSON.parse(document.getElementById("guide-data").textContent));';doc.body.append(runtime);
 return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
