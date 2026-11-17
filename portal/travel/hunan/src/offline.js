// Loaded only on explicit export. Online navigation never downloads the full pack.
async function read(url, type = "text") {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Offline resource HTTP ${response.status}: ${url}`);
  return response[type]();
}
const toDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
export async function createOfflineHTML(data) {
  const base = new URL("../", import.meta.url);
  const [css, app, speech, ...images] = await Promise.all([
    read(new URL("src/styles.css", base)),
    read(new URL("src/app.js", base)),
    read(new URL("src/speech.js", base)),
    ...data.photos.map((p) =>
      read(new URL(p.src, base), "blob").then(toDataURL),
    ),
  ]);
  const snapshot = structuredClone(data);
  const urls = new Map();
  snapshot.photos.forEach((photo, i) => {
    urls.set(photo.src, images[i]);
    photo.src = images[i];
  });
  const clone = document.documentElement.cloneNode(true);
  clone.querySelectorAll("script, #load-status").forEach((el) => el.remove());
  clone.querySelector('link[rel="stylesheet"]').remove();
  const style = document.createElement("style");
  style.textContent = css;
  clone.querySelector("head").append(style);
  clone.querySelectorAll("img").forEach((img) => {
    const source = img.getAttribute("data-src") || img.getAttribute("src");
    if (urls.has(source)) img.setAttribute("src", urls.get(source));
    img.removeAttribute("data-src");
  });
  clone.querySelectorAll("[data-download]").forEach((el) => {
    el.disabled = false;
    el.textContent = "离线保存";
  });
  clone.querySelectorAll(".toast").forEach((el) => (el.hidden = true));
  clone
    .querySelectorAll(".photo-dialog")
    .forEach((el) => el.removeAttribute("open"));
  const content = document.createElement("script");
  content.type = "application/json";
  content.id = "guide-data";
  content.textContent = JSON.stringify(snapshot).replace(/</g, "\\u003c");
  clone.querySelector("body").append(content);
  const runtime = document.createElement("script");
  runtime.textContent =
    speech.replaceAll("export function ", "function ") +
    "\n" +
    app
      .replace(
        /import \{ createSpeechController \} from "\.\/speech\.js";\s*/,
        "",
      )
      .replace("export function initGuide", "function initGuide") +
    '\ninitGuide(JSON.parse(document.getElementById("guide-data").textContent));';
  clone.querySelector("body").append(runtime);
  return "<!doctype html>\n" + clone.outerHTML;
}
