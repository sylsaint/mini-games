import { initGuide } from "./app.js";
const status = document.querySelector("#load-status");
async function start() {
  status.textContent = "正在加载讲解内容…";
  try {
    const response = await fetch(
      new URL("../data/guide.json", import.meta.url),
    );
    if (!response.ok) throw new Error(`Content HTTP ${response.status}`);
    const data = await response.json();
    initGuide(data);
    status.remove();
  } catch (error) {
    status.textContent = "讲解内容加载失败，请检查网络后重试。 ";
    const retry = document.createElement("button");
    retry.className = "btn";
    retry.textContent = "重新加载";
    retry.onclick = () => location.reload();
    status.append(retry);
    console.error(error);
  }
}
start();
