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
    const shouldCancel = Boolean(active || synth?.speaking || synth?.pending);
    current = null;
    if (active) {
      active.button.innerHTML = active.label;
      active.button.setAttribute("aria-pressed", "false");
      active = null;
    }
    if (shouldCancel) synth?.cancel();
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
    let remaining = chunks.length;
    function fail(code) {
      if (token !== generation) return;
      stop();
      if (["interrupted", "canceled"].includes(code)) return;
      const hints = {
        "not-allowed":
          "请在 Safari 中直接点一次“试听声音”；内置浏览器可能限制语音。",
        "voice-unavailable":
          "这个音色不可用，请选择另一种本机音色，或在系统设置中下载中文声音。",
        "language-unavailable":
          "系统没有可用的中文声音，请先在系统辅助功能中下载普通话语音。",
        "synthesis-unavailable":
          "浏览器暂时没有可用的语音引擎，请尝试在 Safari 中打开。",
        "audio-busy": "音频输出正忙，请结束其他音频后重试。",
        "audio-hardware": "请检查设备音量和音频输出，再试一次。",
        network: "系统语音引擎报告网络错误，请换一个已下载的本机音色。",
      };
      const message = `朗读未成功（${code || "unknown"}，${voice.name}）。${hints[code] || "请换一个本机音色后重试；若仍失败，请把此错误代码告诉我。"}`;
      status.textContent = message;
      document.querySelector("#speech-settings").open = true;
      toast(message);
    }
    // Queue within the original click, not a timer/onend callback: preserve iOS activation.
    // Retain utterances until completion so engines cannot lose them to collection.
    current = chunks.map((text) => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = Number(rate.value);
      u.pitch = 1;
      u.onend = () => {
        if (token === generation && --remaining === 0) stop();
      };
      u.onerror = (e) => fail(e.error);
      return u;
    });
    const queue = current;
    try {
      if (synth.paused) synth.resume();
      for (const u of queue) {
        if (token !== generation) break;
        synth.speak(u);
      }
    } catch (error) {
      fail(error.name || "synthesis-failed");
    }
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
  const previewClick = () => speak(
      "沿着山水，读一读湖南。先看一看眼前的风景，再听一个有趣的故事。",
      preview,
    );
  preview.addEventListener("click", previewClick);
  synth?.addEventListener("voiceschanged", refresh);
  refresh();
  return { speak, stop, destroy() { stop(); select.removeEventListener("change", save); rate.removeEventListener("change", save); preview.removeEventListener("click", previewClick); synth?.removeEventListener?.("voiceschanged", refresh); } };
}
