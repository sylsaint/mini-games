import { createSpeechController } from "./speech.js";
export function initGuide(DATA) {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s),
    $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icon = (name) =>
    `<svg fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-${esc(name)}"/></svg>`;
  const getStation = (id) => DATA.stations.find((s) => s.id === id),
    getPerson = (id) => DATA.people.find((p) => p.id === id),
    getPoem = (id) => DATA.poems.find((p) => p.id === id);
  let selected = location.hash.startsWith("#station-")
    ? location.hash.slice(9)
    : "city";
  if (!getStation(selected)) selected = "city";
  let learned = new Set();
  try {
    const saved = JSON.parse(
      localStorage.getItem("xiangxing-passport-v1") || "[]",
    );
    if (Array.isArray(saved))
      learned = new Set(saved.filter((id) => getStation(id)));
  } catch {}
  let toastTimer = null;
  function toast(t) {
    const el = $("#toast");
    el.textContent = t;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 3100);
  }
  const { speak, stop: stopSpeech } = createSpeechController({ toast, icon });
  function sourceList(sources) {
    return (sources || [])
      .map(
        (s) =>
          `<div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(s.title)}</a>${s.supports ? `<p>${esc(s.supports)}</p>` : ""}</div>`,
      )
      .join("");
  }
  const photos = DATA.photos || [],
    getPhoto = (id) => photos.find((p) => p.id === id);
  const imageObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries)
              if (entry.isIntersecting) {
                loadImage(entry.target);
                imageObserver.unobserve(entry.target);
              }
          },
          { rootMargin: "120px" },
        )
      : null;
  function loadImage(img) {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      delete img.dataset.src;
    }
  }
  function observeImages() {
    $$("img[data-src]").forEach((img) =>
      imageObserver ? imageObserver.observe(img) : loadImage(img),
    );
  }
  function photoCredit(p) {
    return `${esc(p.author)} · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a> · <a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">图片来源 ↗</a>`;
  }
  function photoCard(p, compact = false) {
    return `<figure class="photo-card"><button class="photo-open${p.contain ? " contain" : ""}" data-photo="${esc(p.id)}" aria-label="放大查看：${esc(p.title)}"><img data-src="${p.src}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" alt="${esc(p.alt)}"></button><figcaption><div class="photo-meta"><span class="photo-type${p.kind === "historic" || p.kind === "drawing" ? " historic" : ""}">${esc(p.kindLabel)}</span><span class="photo-year">${esc(p.yearLabel)}</span></div><h5>${esc(p.title)}</h5><p>${esc(p.caption)}</p>${!compact && p.lookFor ? `<p class="photo-look"><b>一起找一找：</b>${esc(p.lookFor)}</p>` : ""}<div class="photo-credit">${photoCredit(p)}</div></figcaption></figure>`;
  }
  function photoGallery(s) {
    const list = (s.photoIds || []).map(getPhoto).filter(Boolean);
    if (!list.length) return "";
    return `<section class="photo-section" aria-label="${esc(s.navTitle || s.name)}的真实图像"><div class="photo-intro"><h4>看图讲故事</h4><span>照片按需加载 · 离线保存后可完整查看</span></div><div class="photo-grid">${list.map((p) => photoCard(p)).join("")}</div>${s.photoNote ? `<p class="photo-section-note">${esc(s.photoNote)}</p>` : ""}</section>`;
  }
  $("#archive-pair").innerHTML = (DATA.archivePair || [])
    .map(getPhoto)
    .filter(Boolean)
    .map((p) => photoCard(p, true))
    .join("");
  $("#photo-count").textContent = photos.length;
  $("#photo-source-count").textContent = photos.length;
  $("#photo-sources").innerHTML = photos
    .map(
      (p) =>
        `<div class="image-source-item"><b>${esc(p.title)} · ${esc(p.yearLabel)}</b><div>${photoCredit(p)}</div><p>${esc(p.changeNote || "图片按原图比例展示。")}</p></div>`,
    )
    .join("");
  const photoDialog = $("#photo-dialog");
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-photo]");
    if (opener) {
      const p = getPhoto(opener.dataset.photo);
      if (!p) return;
      $("#photo-dialog-image").src = p.src;
      $("#photo-dialog-image").alt = p.alt;
      $("#photo-dialog-title").textContent = p.title;
      $("#photo-dialog-meta").textContent = `${p.kindLabel} · ${p.yearLabel}`;
      $("#photo-dialog-desc").textContent = p.caption;
      $("#photo-dialog-look").textContent =
        p.lookFor || "看看画面里有哪些细节，再回到现场寻找。";
      $("#photo-dialog-credit").innerHTML = photoCredit(p);
      $("#photo-dialog-changes").textContent = p.changeNote || "";
      if (typeof photoDialog.showModal === "function") photoDialog.showModal();
      else {
        photoDialog.setAttribute("open", "");
        $("#photo-dialog-close").focus();
      }
      return;
    }
    if (e.target.closest("#photo-dialog-close") || e.target === photoDialog) {
      if (typeof photoDialog.close === "function") photoDialog.close();
      else photoDialog.removeAttribute("open");
    }
  });
  photoDialog.addEventListener("close", () => {
    $("#photo-dialog-image").removeAttribute("src");
  });

  function renderNav(query = "") {
    const q = query.trim().toLowerCase();
    let count = 0;
    $("#station-nav").innerHTML =
      DATA.stations
        .map((s, i) => {
          const hay = JSON.stringify(s).toLowerCase();
          if (q && !hay.includes(q)) return "";
          count++;
          return `<button class="station-button${s.id === selected ? " active" : ""}${learned.has(s.id) ? " done" : ""}" data-select="${s.id}" aria-current="${s.id === selected ? "true" : "false"}"><span class="station-no">${String(i + 1).padStart(2, "0")}</span><span class="station-button-text"><strong>${esc(s.navTitle || s.name)}</strong><small>${esc(s.tagline)}</small></span><span class="station-done" aria-label="已学习">✓</span></button>`;
        })
        .join("") ||
      (q
        ? '<p class="no-results">没找到这个关键词，试试“爱晚亭”“帛书”或“范仲淹”。</p>'
        : "");
    return count;
  }
  function sealDemo() {
    return `<div class="seal"><div class="seal-top"><strong>动手看一看：一层层怎样保护？</strong><span class="muted small">结构示意，非考古比例</span></div><div class="seal-view"><svg class="seal-diagram" viewBox="0 0 340 210" role="img" aria-label="由外到内的墓葬封护结构示意"><rect class="seal-rect active" data-layer-shape="0" x="8" y="8" width="324" height="194" rx="15" fill="#d4c4a2" stroke="#b7a683"/><rect class="seal-rect" data-layer-shape="1" x="31" y="30" width="278" height="150" rx="9" fill="#f6edcf" stroke="#d8cda8"/><rect class="seal-rect" data-layer-shape="2" x="55" y="52" width="230" height="106" rx="5" fill="#6d7368" stroke="#515b50"/><rect class="seal-rect" data-layer-shape="3" x="84" y="75" width="172" height="61" rx="2" fill="#c28e59" stroke="#98673f"/><rect class="seal-rect" data-layer-shape="4" x="124" y="90" width="92" height="31" rx="4" fill="#725036" stroke="#4e3c2c"/><text x="170" y="111" text-anchor="middle" fill="#fff8e8" font-size="15">棺</text></svg><div class="seal-controls">${["封土", "白膏泥", "木炭", "木椁", "棺"].map((x, i) => `<button class="${i === 0 ? "active" : ""}" data-layer="${i}" aria-pressed="${i === 0}">${i + 1} ${x}</button>`).join("")}</div></div><p class="seal-explain" aria-live="polite">封土：地面上的土堆和墓坑填土，把墓葬深埋在地下。</p></div>`;
  }
  function lakeDemo() {
    return `<div class="lake-demo"><div class="lake-moon"></div><div class="lake-island"></div><div class="lake-shine"></div><div class="lake-caption"><span>意境示意：白天看湖，也能想象诗中月夜。</span><button class="lake-toggle" aria-pressed="false">切到诗中月夜 ☾</button></div></div>`;
  }
  function stationHTML(s, i) {
    const people = (s.people || []).map(getPerson).filter(Boolean);
    const poems = (s.poems || []).map(getPoem).filter(Boolean);
    return `<article id="station-${s.id}" class="station" ${s.id !== selected ? "hidden" : ""} aria-labelledby="title-${s.id}"><header class="station-heading"><div class="tag-line"><span class="eyebrow">讲解卡 ${String(i + 1).padStart(2, "0")}</span><span class="pill${s.optional ? " orange" : ""}">${esc(s.area)}${s.optional ? " · 预约成功后备选" : ""}</span></div><h3 id="title-${s.id}">${esc(s.name)}</h3><p>${esc(s.subtitle)}</p><div class="location-line">${icon("pin")}<span>${esc(s.location)}</span></div></header>${photoGallery(s)}<div class="story-top"><div class="story-title">${icon("book")}直接读给孩子听 · 约2分钟</div><button class="listen-btn" data-speak="${s.id}" aria-pressed="false">${icon("sound")}听一遍</button></div><div class="story">${s.story.map((p) => `<p>${esc(p)}</p>`).join("")}</div><div class="takeaway"><strong>记住这一句：</strong>${esc(s.takeaway)}</div>${s.interactive === "seal" ? sealDemo() : s.interactive === "lake" ? lakeDemo() : ""}<div class="micro-title">${icon("compass")}现场找这几条线索</div><ol class="facts-list">${s.facts.map((f, j) => `<li><span class="fact-number">${j + 1}</span><div class="fact-body"><strong>${esc(f.title)}</strong><p>${esc(f.text)}</p></div></li>`).join("")}</ol>${s.boundary ? `<aside class="boundary"><strong>${esc(s.boundary.title || "讲给孩子时，分清这一点")}</strong><p>${esc(s.boundary.text || s.boundary)}</p></aside>` : ""}${people.length ? `<div class="micro-title">${icon("star")}这站认识谁</div><div class="people-tags">${people.map((p) => `<a class="person-tag" href="#person-${p.id}"><b>${esc(p.name)}</b> · ${esc(p.shortRole)}</a>`).join("")}</div>` : ""}${
      poems.length
        ? `<div class="micro-title">${icon("book")}在这里读一读</div>${poems
            .map(
              (p) =>
                `<div class="related-poem"><h4>《${esc(p.title)}》 · ${esc(p.author)}</h4><p>${p.lines
                  .slice(0, p.excerptCount || 2)
                  .map(esc)
                  .join(
                    "<br>",
                  )}</p><small>${esc(p.stationNote || p.context)}</small><br><a class="text-link small" href="#poem-${p.id}">打开完整诗文与儿童译意 ↗</a></div>`,
            )
            .join("")}`
        : ""
    }<div class="micro-title">${icon("leaf")}亲子小任务</div><div class="tasks"><ul>${s.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div><details class="parent-details"><summary>家长备课：历史时间线与讲解提示</summary><div class="detail-content">${s.timeline?.length ? `<ul class="history-timeline">${s.timeline.map((t) => `<li><b>${esc(t.when)}</b><span>${esc(t.text)}</span></li>`).join("")}</ul>` : ""}${(s.parentNotes || []).map((p) => `<p>${esc(p)}</p>`).join("")}</div></details><details class="source-details"><summary>这张讲解卡的资料来源（${s.sources.length}）</summary><div class="detail-content source-links">${sourceList(s.sources)}</div></details><footer class="station-footer"><button class="stamp-btn${learned.has(s.id) ? " stamped" : ""}" data-stamp="${s.id}">${icon("check")}<span>${learned.has(s.id) ? "这站已盖章" : "这站学会啦，盖个章"}</span></button><div class="station-steps"><button data-step="-1" data-from="${s.id}" aria-label="上一站">←</button><button data-step="1" data-from="${s.id}" aria-label="下一站">→</button></div></footer></article>`;
  }
  function selectStation(id, scroll = false) {
    if (!getStation(id)) return;
    stopSpeech();
    selected = id;
    $$(".station").forEach((el) => (el.hidden = el.id !== `station-${id}`));
    renderNav($("#station-search").value);
    $$(".map-pin").forEach((el) =>
      el.classList.toggle("active", el.dataset.station === id),
    );
    if (scroll)
      $("#guide").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
  }
  function updatePassport() {
    const count = learned.size,
      total = DATA.stations.length;
    $("#passport-count").textContent = count;
    $("#passport-total").textContent = total;
    $("#floating-count").textContent = `${count} / ${total}`;
    $("#passport-progress").style.width = `${(count / total) * 100}%`;
    $("#passport-stamps").innerHTML = DATA.stations
      .map(
        (s) =>
          `<div class="passport-stamp${learned.has(s.id) ? " earned" : ""}" title="${esc(s.name)}：${learned.has(s.id) ? "已盖章" : "未盖章"}">${icon(s.icon || "star")}<span>${esc(s.stampLabel || s.navTitle || s.name)}</span></div>`,
      )
      .join("");
  }
  function renderPeople() {
    $("#people-grid").innerHTML = DATA.people
      .map(
        (p) =>
          `<article class="person-card" id="person-${p.id}"><div class="person-head"><span class="person-seal" aria-hidden="true">${esc(p.name[0])}</span><div><h3>${esc(p.name)}</h3><small>${esc(p.era)} · ${esc(p.shortRole)}</small></div></div><p>${esc(p.bio)}</p><div class="person-relation">${esc(p.relation)}</div></article>`,
      )
      .join("");
  }
  function renderPoems() {
    $("#poem-grid").innerHTML = DATA.poems
      .map(
        (p) =>
          `<article class="poem-card" id="poem-${p.id}"><h3>《${esc(p.title)}》${p.excerpt ? "（节选）" : ""}</h3><div class="poem-author">${esc(p.era)} · ${esc(p.author)}</div><div class="poem-lines">${p.lines.map((line) => `<p>${esc(line)}</p>`).join("")}</div><p class="poem-desc">${esc(p.prompt)}</p><div class="poem-tools"><button class="btn ghost" data-translate="${p.id}" aria-expanded="false" aria-controls="translation-${p.id}">用孩子的话说一遍 ＋</button><button class="btn ghost poem-listen" data-poem-speak="${p.id}" aria-pressed="false">${icon("sound")}听一遍</button></div><div class="poem-translation" id="translation-${p.id}" hidden>${esc(p.translation)}</div><p class="poem-context">${esc(p.context)}</p><p class="poem-source">原文核对：<a href="${esc(p.source.url)}" target="_blank" rel="noopener noreferrer">${esc(p.source.title)}</a></p></article>`,
      )
      .join("");
  }
  const quizzes = DATA.stations.flatMap((s) =>
    (s.quiz || []).map((q) => ({ ...q, stationId: s.id, stationName: s.name })),
  );
  let quizIndex = 0,
    answered = new Set(),
    currentAnswered = false;
  function renderQuiz() {
    const q = quizzes[quizIndex];
    if (!q) return;
    currentAnswered = false;
    $("#quiz-location").textContent = q.stationName;
    $("#quiz-counter").textContent = `${quizIndex + 1} / ${quizzes.length}`;
    $("#quiz-question").textContent = q.question;
    $("#quiz-options").innerHTML = q.options
      .map(
        (o, i) =>
          `<button class="quiz-option" data-option="${i}"><span class="option-letter">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></button>`,
      )
      .join("");
    $("#quiz-feedback").hidden = true;
    $("#quiz-feedback").textContent = "";
    $("#quiz-score").textContent = answered.size
      ? `你已经读懂 ${answered.size} 道题，继续发现。`
      : "慢慢想，也可以回讲解卡找线索。";
  }
  function handleAnswer(index) {
    if (currentAnswered) return;
    const q = quizzes[quizIndex],
      buttons = $$(".quiz-option");
    if (index === q.answer) {
      currentAnswered = true;
      answered.add(quizIndex);
      buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === index) b.classList.add("correct");
      });
      $("#quiz-feedback").textContent = "答对啦！" + q.explanation;
      $("#quiz-score").textContent = `你已经读懂 ${answered.size} 道题。`;
    } else {
      buttons[index].classList.add("wrong");
      buttons[index].disabled = true;
      $("#quiz-feedback").textContent =
        "再想一想：" + (q.hint || "回到这站的讲解卡，找找证据。");
    }
    $("#quiz-feedback").hidden = false;
  }
  const allSources = [];
  for (const s of DATA.stations)
    for (const ref of s.sources) {
      if (!allSources.some((x) => x.url === ref.url)) allSources.push(ref);
    }
  for (const p of DATA.poems)
    if (!allSources.some((x) => x.url === p.source.url))
      allSources.push(p.source);
  $("#stat-stations").textContent = DATA.stations.length;
  $("#stat-poems").textContent = DATA.poems.length;
  $("#station-content").innerHTML = DATA.stations.map(stationHTML).join("");
  renderNav();
  renderPeople();
  renderPoems();
  renderQuiz();
  updatePassport();
  selectStation(selected);
  $("#all-sources").innerHTML = allSources
    .map(
      (s) =>
        `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(s.title)}</a></li>`,
    )
    .join("");
  DATA.stations.forEach((s) => {
    if (!s.subStops?.length) return;
    const target = $("#station-" + s.id + " .tasks");
    for (const sub of s.subStops) {
      const detail = document.createElement("details");
      detail.className = "substop";
      detail.innerHTML =
        "<summary>" +
        esc(sub.name) +
        '</summary><div class="detail-content"><p>' +
        esc(sub.text) +
        "</p></div>";
      target.before(detail);
    }
  });
  observeImages();
  $("#station-search").addEventListener("input", (e) =>
    renderNav(e.target.value),
  );
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.select) {
      selectStation(b.dataset.select);
      return;
    }
    if (b.dataset.station) {
      $("#station-search").value = "";
      selectStation(b.dataset.station, true);
      return;
    }
    if (b.dataset.mode) {
      const parent = b.dataset.mode === "parent";
      document.body.classList.toggle("parent-mode", parent);
      $$("[data-mode]").forEach((x) => {
        const active = x === b;
        x.classList.toggle("active", active);
        x.setAttribute("aria-pressed", String(active));
      });
      $$(".parent-details").forEach((x) => (x.open = parent));
      return;
    }
    if (b.dataset.speak) {
      const s = getStation(b.dataset.speak);
      speak(s.name + "。" + s.story.join("\n\n"), b);
      return;
    }
    if (b.dataset.poemSpeak) {
      const p = getPoem(b.dataset.poemSpeak);
      speak(p.title + "。" + p.author + "。" + p.lines.join("\n"), b);
      return;
    }
    if (b.dataset.stamp) {
      const id = b.dataset.stamp;
      if (!learned.has(id)) {
        learned.add(id);
        try {
          localStorage.setItem(
            "xiangxing-passport-v1",
            JSON.stringify([...learned]),
          );
        } catch {}
        b.classList.add("stamped");
        $("span", b).textContent = "这站已盖章";
        renderNav($("#station-search").value);
        updatePassport();
        toast("收获一枚「" + getStation(id).stampLabel + "」学习印记！");
      } else toast("这一站已经盖过章啦，换一站继续发现。");
      return;
    }
    if (b.dataset.step) {
      let i = DATA.stations.findIndex((s) => s.id === b.dataset.from);
      i =
        (i + Number(b.dataset.step) + DATA.stations.length) %
        DATA.stations.length;
      $("#station-search").value = "";
      selectStation(DATA.stations[i].id, true);
      return;
    }
    if (b.dataset.translate) {
      const el = $("#translation-" + b.dataset.translate);
      el.hidden = !el.hidden;
      b.setAttribute("aria-expanded", String(!el.hidden));
      b.textContent = el.hidden ? "用孩子的话说一遍 ＋" : "收起儿童译意 −";
      return;
    }
    if (b.dataset.option !== undefined) {
      handleAnswer(Number(b.dataset.option));
      return;
    }
    if (b.id === "next-quiz") {
      quizIndex = (quizIndex + 1) % quizzes.length;
      renderQuiz();
      return;
    }
    if (b.dataset.layer !== undefined) {
      const n = Number(b.dataset.layer),
        root = b.closest(".seal");
      $$("[data-layer]", root).forEach((x) => {
        const active = x === b;
        x.classList.toggle("active", active);
        x.setAttribute("aria-pressed", String(active));
      });
      $$("[data-layer-shape]", root).forEach((x) =>
        x.classList.toggle("active", Number(x.dataset.layerShape) === n),
      );
      const descriptions = [
        "封土：地面上的土堆和墓坑填土，把墓葬深埋在地下。",
        "白膏泥：一种黏性较强、透水性较低的土，用来填塞封护。",
        "木炭：棺椁周围的封护材料之一。保存条件是深埋、密封与环境等多种因素共同作用的结果。",
        "木椁（guǒ）：棺外较大的木结构，旁边的边厢可放随葬物品。",
        "棺（guān）：用来安放逝者的葬具，位于椁的内部。",
      ];
      $(".seal-explain", root).textContent = descriptions[n];
      return;
    }
    if (b.classList.contains("lake-toggle")) {
      const root = b.closest(".lake-demo"),
        night = root.classList.toggle("night");
      b.setAttribute("aria-pressed", String(night));
      b.textContent = night ? "切回白天看湖 ☀" : "切到诗中月夜 ☾";
      return;
    }
    if (b.hasAttribute("data-print")) {
      const images = $$("img[data-src]");
      images.forEach(loadImage);
      await Promise.allSettled($$("img").map((img) => img.decode()));
      window.print();
      return;
    }
    if (b.hasAttribute("data-download")) {
      if (b.disabled) return;
      const label = b.innerHTML;
      b.disabled = true;
      b.textContent = "正在准备完整离线版…";
      try {
        let html;
        if (document.getElementById("guide-data"))
          html = "<!doctype html>\n" + document.documentElement.outerHTML;
        else {
          const { createOfflineHTML } = await import("./offline.js");
          html = await createOfflineHTML(DATA);
        }
        const url = URL.createObjectURL(
            new Blob([html], { type: "text/html;charset=utf-8" }),
          ),
          a = document.createElement("a");
        a.href = url;
        a.download = "湘行小课堂-长沙岳阳亲子讲解手册.html";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast("完整离线HTML已准备好，保存后无需联网查看。");
      } catch (error) {
        toast("离线保存未完成，请检查网络后重试。");
        console.error(error);
      } finally {
        b.disabled = false;
        b.innerHTML = label;
      }
      return;
    }
  });
  let printDetails = [];
  window.addEventListener("beforeprint", () => {
    stopSpeech();
    printDetails = $$("details").map((el) => ({ el, open: el.open }));
    printDetails.forEach((x) => (x.el.open = true));
  });
  window.addEventListener("afterprint", () => {
    printDetails.forEach((x) => (x.el.open = x.open));
  });
  window.addEventListener("pagehide", stopSpeech);
}
