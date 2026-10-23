const list = document.querySelector("#game-list");
async function load() {
  document.querySelector("#load-error").hidden = true;
  try {
    const response = await fetch("/games.json");
    if (!response.ok) throw Error("HTTP " + response.status);
    const games = await response.json();
    list.replaceChildren();
    for (const game of games) {
      const link = document.createElement("a");
      link.className = "game-card";
      link.href = game.url;
      const picture = document.createElement("img");
      picture.src = game.cover;
      picture.alt = game.name + " 游戏封面";
      picture.width = 640;
      picture.height = 400;
      const body = document.createElement("div");
      body.className = "card-body";
      const tags = document.createElement("div");
      tags.className = "tags";
      for (const label of game.tags) {
        const tag = document.createElement("span");
        tag.textContent = label;
        tags.append(tag);
      }
      const title = document.createElement("h3");
      title.textContent = game.name;
      const description = document.createElement("p");
      description.textContent = game.description;
      const bottom = document.createElement("div");
      bottom.className = "card-bottom";
      bottom.append(document.createTextNode("即刻开玩"));
      const arrow = document.createElement("span");
      arrow.textContent = "↗";
      bottom.append(arrow);
      body.append(tags, title, description, bottom);
      link.append(picture, body);
      list.append(link);
    }
    document.querySelector("#game-count").textContent =
      games.length + " 款小游戏 · 持续上新";
  } catch {
    document.querySelector("#load-error").hidden = false;
    document.querySelector("#game-count").textContent = "加载遇到一点问题";
  }
}
document.querySelector("#retry").addEventListener("click", load);
document.querySelector("#year").textContent = new Date().getFullYear();
load();
