import test from "node:test";
import assert from "node:assert/strict";
import {
  localMandarinVoices,
  speechChunks,
} from "../portal/travel/hunan/src/speech.js";
const voice = (name, lang = "zh-CN", localService = true) => ({
  name,
  voiceURI: name,
  lang,
  localService,
});
test("Mandarin selection prefers dedicated local voices, never cloud or Cantonese", () => {
  const voices = [
    voice("Eddy"),
    voice("Google 普通话", "zh-CN", false),
    voice("Tingting"),
    voice("Li-Mu"),
    voice("Yu-shu"),
    voice("Sinji", "zh-HK"),
    voice("Meijia", "zh-TW"),
  ];
  assert.deepEqual(
    localMandarinVoices(voices).map((v) => v.name),
    ["Yu-shu", "Li-Mu", "Tingting", "Eddy", "Meijia"],
  );
  assert.equal(voices[0].name, "Eddy");
  assert.equal(
    localMandarinVoices([voice("Google 普通话", "zh-CN", false)]).length,
    0,
  );
  assert.equal(
    localMandarinVoices([voice("Tingting"), voice("Tingting (Enhanced)")])[0]
      .name,
    "Tingting (Enhanced)",
  );
});
test("Speech chunks preserve sentence punctuation and bound long utterances", () => {
  assert.deepEqual(speechChunks("山在哪里？\n水往哪边！再看一看。"), [
    "山在哪里？",
    "水往哪边！",
    "再看一看。",
  ]);
  const long = "春".repeat(401) + "。";
  const chunks = speechChunks(long);
  assert.ok(chunks.every((s) => s.length <= 160));
  assert.equal(chunks.join(""), long);
  assert.deepEqual(speechChunks("  \n"), []);
});
