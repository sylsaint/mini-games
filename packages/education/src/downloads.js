export function downloadJson(value, filename) {
 const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {type:'application/json'}));
 const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
 setTimeout(() => URL.revokeObjectURL(url), 1000);
}
