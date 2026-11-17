/** Only call after mount. Never persist defaults as a side effect of reading. */
export function readLocal<T>(key:string, fallback:T, validate:(v:unknown)=>boolean = ()=>true): {value:T;available:boolean} {
try { const raw = localStorage.getItem(key); if (raw === null) return {value:fallback,available:true}; const value = JSON.parse(raw); return validate(value) ? {value,available:true} : {value:fallback,available:false}; } catch { return {value:fallback,available:false}; }
}
export function writeLocal(key:string,value:unknown):boolean { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
