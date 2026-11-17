// Only explicitly local Mandarin voices: never silently send guide text to a cloud TTS.
export function localMandarinVoices(voices) {
  const score = (v) => {
    const name = `${v.name} ${v.voiceURI}`;
    return (
      (/^(zh[-_](CN|SG)|cmn)/i.test(v.lang) ? 1000 : 0) +
      (/premium|enhanced|增强|增強|高质量|優質|优质/i.test(name) ? 300 : 0) +
      (/yu[- ]?shu|语舒|語舒/i.test(name)
        ? 230
        : /li[- ]?mu|李沐/i.test(name)
          ? 220
          : /ting[- ]?ting|婷婷/i.test(name)
            ? 200
            : 0) -
      (/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i.test(v.name)
        ? 100
        : 0)
    );
  };
  return voices
    .filter(
      (v) =>
        v.localService === true &&
        /^(zh|cmn)([-_]|$)/i.test(v.lang) &&
        !/^zh[-_](HK|MO)/i.test(v.lang),
    )
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
}
export function speechChunks(text) {
  return (text.match(/[^。！？!?；;\n]+[。！？!?；;]*|[^\s]/gu) || [])
    .flatMap((sentence) => {
      const chars = Array.from(sentence.trim()),
        result = [];
      while (chars.length) result.push(chars.splice(0, 160).join(""));
      return result;
    })
    .filter(Boolean);
}
export function createSpeechController({ toast, icon }) {
  const synth = window.speechSynthesis;
  const select = document.querySelector("#speech-voice"),
    rate = document.querySelector("#speech-rate");
  const status = document.querySelector("#speech-status"),
    preview = document.querySelector("#speech-preview");
  preview.textContent = "试听声音";
  preview.setAttribute("aria-pressed", "false");
  const key = "xiangxing-speech-v1";
  let preference = {},
    voices = [],
    active = null,
    generation = 0,
    timer = null,
    current = null;
  try {
    preference = JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {}
  rate.value = ["0.85", "0.95", "1", "1.1"].includes(String(preference.rate))
    ? String(preference.rate)
    : "0.95";
  const voiceKey = (v) => `${v.voiceURI}|${v.lang}`;
  function refresh() {
    voices = localMandarinVoices(synth?.getVoices() || []);
    select.replaceChildren();
    for (const voice of voices) {
      const option = document.createElement("option");
      option.value = voiceKey(voice);
      option.textContent = `${voice.name} · ${voice.lang} · 本机`;
      select.append(option);
    }
    if (voices.some((v) => voiceKey(v) === preference.voice))
      select.value = preference.voice;
    select.disabled = !voices.length;
    status.textContent = voices.length
      ? `当前：${voices.find((v) => voiceKey(v) === select.value)?.name}。只使用本机语音，可试听比较。`
      : "还没有可用的本机普通话语音。可在系统辅助功能中下载中文声音，再刷新此页。";
  }
  function stop() {
    generation++;
    clearTimeout(timer);
    current = null;
    if (active) {
      active.button.innerHTML = active.label;
      active.button.setAttribute("aria-pressed", "false");
      active = null;
    }
    synth?.cancel();
  }
  function speak(text, button) {
    if (active?.button === button) {
      stop();
      return;
    }
    stop();
    refresh();
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      toast("这个浏览器暂不支持朗读，请直接阅读讲解稿。");
      return;
    }
    const voice = voices.find((v) => voiceKey(v) === select.value);
    if (!voice) {
      toast(
        "本机普通话声音尚未就绪。请打开“朗读音色与语速”查看说明，稍后再试。",
      );
      return;
    }
    const chunks = speechChunks(text);
    if (!chunks.length) return;
    const token = generation;
    active = { button, label: button.innerHTML };
    button.innerHTML = icon("sound") + "停止朗读";
    button.setAttribute("aria-pressed", "true");
    let index = 0;
    function next() {
      if (token !== generation) return;
      if (index === chunks.length) {
        stop();
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[index++]);
      current = u;
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = Number(rate.value);
      u.pitch = 1;
      u.onend = () => {
        if (token === generation) timer = setTimeout(next, 90);
      };
      u.onerror = (e) => {
        if (token !== generation) return;
        stop();
        if (!["interrupted", "canceled"].includes(e.error))
          toast("朗读暂时失败，请换一个本机音色后重试。");
      };
      synth.speak(u);
    }
    next();
  }
  function save() {
    stop();
    preference = { voice: select.value, rate: Number(rate.value) };
    try {
      localStorage.setItem(key, JSON.stringify(preference));
    } catch {}
    refresh();
  }
  select.addEventListener("change", save);
  rate.addEventListener("change", save);
  preview.addEventListener("click", () =>
    speak(
      "沿着山水，读一读湖南。先看一看眼前的风景，再听一个有趣的故事。",
      preview,
    ),
  );
  synth?.addEventListener("voiceschanged", refresh);
  refresh();
  return { speak, stop };
}
