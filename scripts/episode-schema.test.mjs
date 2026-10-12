// 期数据结构与脚本解析的单元测试（Node 22 原生 strip-types 直接加载 .ts）
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultExportName,
  duplicateEpisode,
  exportNameFor,
  normalizeContent,
  normalizeEpisode,
  normalizeTiming,
  renumberBeats,
  toEpisodeFile,
} from "../src/templates/schema.ts";
import { episodeToScript, parseScript } from "../src/templates/script-parser.ts";

const CARDS = {
  id: "rule-cards",
  name: "法则卡片",
  category: "要点",
  desc: "",
  aliases: ["三法则"],
  fields: [
    { key: "title", type: "text", label: "标题" },
    {
      key: "cards",
      type: "list",
      label: "法则卡",
      itemLabel: "卡",
      min: 2,
      max: 5,
      itemFields: [
        { key: "mark", type: "stamp", label: "印字" },
        { key: "text", type: "text", label: "主文案" },
        { key: "icon", type: "icon", label: "图标" },
      ],
    },
  ],
  defaults: { title: "存茶三法则", cards: [{ mark: "干", text: "干不干", icon: "damp" }, { mark: "封", text: "封没封严", icon: "lock" }] },
};
const HOOK = {
  id: "hook-stamp",
  name: "开门大字 · 误区印章",
  category: "开场",
  desc: "",
  aliases: ["开门大字", "误区"],
  fields: [
    { key: "myth", type: "textarea", label: "误区大字" },
    { key: "stamp", type: "stamp", label: "印章字（1-4 字）" },
    { key: "stampStyle", type: "select", label: "否定方式", options: [{ value: "seal", label: "方印砸落" }, { value: "cross", label: "朱红大叉 + 小印" }] },
    { key: "statFrom", type: "number", label: "数据起点", min: 0, max: 9999 },
    { key: "show", type: "toggle", label: "显示" },
  ],
  defaults: { myth: "越放越香", stamp: "毁茶", stampStyle: "seal", statFrom: 100, show: false },
};
const METAS = [CARDS, HOOK];
const metaOf = (id) => METAS.find((m) => m.id === id);
const findTemplate = (name) =>
  METAS.find((m) => m.id === name || m.name === name || m.aliases.some((a) => a === name || name.includes(a)));
const iconOf = (s) => ({ 潮气: "damp", 密封: "lock" })[s] ?? s;

test("normalizeContent fills defaults, clamps lists and numbers, maps select labels", () => {
  const c = normalizeContent(HOOK, { myth: "频繁开大袋", stampStyle: "朱红大叉 + 小印", statFrom: "99999", show: "是" });
  assert.equal(c.myth, "频繁开大袋");
  assert.equal(c.stamp, "毁茶");
  assert.equal(c.stampStyle, "cross");
  assert.equal(c.statFrom, 9999);
  assert.equal(c.show, true);
  const cards = normalizeContent(CARDS, { cards: ["只有一张"] });
  assert.equal(cards.cards.length, 2, "pads to min");
  assert.equal(cards.cards[0].mark, "只有一张");
  const many = normalizeContent(CARDS, { cards: Array.from({ length: 9 }, (_, i) => ({ text: `卡${i}` })) });
  assert.equal(many.cards.length, 5, "truncates to max");
});

test("normalizeTiming clamps bad values", () => {
  assert.deepEqual(normalizeTiming({ pace: -1, holdSec: "x" }), { pace: 1, holdSec: 1.2 });
  assert.deepEqual(normalizeTiming({ pace: 9, holdSec: 2, durationSec: 12 }), { pace: 3, holdSec: 2, durationSec: 12 });
});

test("normalizeEpisode accepts episode files, drops unknown templates, keeps bespoke", () => {
  const raw = {
    kind: "zhengshang-episode",
    version: 1,
    episode: {
      number: "20",
      title: "白茶能煮吗",
      theme: "nope",
      beats: [
        { template: "hook-stamp", code: "B1", content: { myth: "老白茶都能煮" } },
        { template: "ghost", code: "B2" },
        { template: "bespoke", code: "B3", content: { clipId: "ep18-b1", myth: "x" } },
      ],
    },
  };
  const { episode, warnings } = normalizeEpisode(raw, metaOf);
  assert.equal(episode.number, 20);
  assert.equal(episode.theme, "classic");
  assert.equal(episode.beats.length, 2);
  assert.equal(episode.beats[0].content.myth, "老白茶都能煮");
  assert.equal(episode.beats[0].title, "开门大字 · 误区印章");
  assert.equal(episode.beats[1].content.clipId, "ep18-b1");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /ghost/);
});

test("export names, duplication and renumbering", () => {
  assert.equal(defaultExportName(20, { code: "B1", title: "破 题/x" }), "正上茶舍_20_B1_破题x.mp4");
  assert.equal(exportNameFor({ number: 20 }, { code: "B1", title: "t", exportName: "自定义" }), "自定义.mp4");
  const { episode } = normalizeEpisode({ number: 19, title: "t", beats: [{ template: "hook-stamp", code: "B1" }, { template: "hook-stamp", code: "B4-2" }] }, metaOf);
  const copy = duplicateEpisode(episode, { number: 20 });
  assert.equal(copy.number, 20);
  assert.notEqual(copy.id, episode.id);
  assert.notEqual(copy.beats[0].id, episode.beats[0].id);
  copy.beats[0].content.myth = "改了";
  assert.equal(episode.beats[0].content.myth, "越放越香", "deep copy");
  const renum = renumberBeats([...copy.beats].reverse());
  assert.deepEqual(renum.map((b) => b.code), ["B4-2", "B2"]);
  assert.equal(toEpisodeFile(episode).kind, "zhengshang-episode");
});

test("parseScript reads a structured script into beats", () => {
  const script = `# 第20期 · 白茶能不能煮

## B1 开门大字 | 破题
误区大字: 老白茶都能煮
印章: 伤茶
否定方式: 朱红大叉 + 小印
数据起点: 80
显示: 是
时长: 9.5

## 三法则
标题: 煮茶三要点
法则卡:
- 老 | 年份够老 | 潮气
- 封没封严
- 净 | 器具干净 | 密封
不存在的字段: x

## 不存在的模板
随便: 1
`;
  const r = parseScript(script, { findTemplate, iconOf });
  assert.equal(r.number, 20);
  assert.equal(r.title, "白茶能不能煮");
  assert.equal(r.beats.length, 2);
  const [a, b] = r.beats;
  assert.equal(a.code, "B1");
  assert.equal(a.title, "破题");
  assert.equal(a.content.myth, "老白茶都能煮");
  assert.equal(a.content.stamp, "伤茶");
  assert.equal(a.content.stampStyle, "朱红大叉 + 小印");
  assert.equal(a.content.statFrom, 80);
  assert.equal(a.content.show, true);
  assert.equal(a.timing.durationSec, 9.5);
  assert.equal(b.template, "rule-cards");
  assert.equal(b.code, "B2");
  assert.deepEqual(b.content.cards[0], { mark: "老", text: "年份够老", icon: "damp" });
  assert.deepEqual(b.content.cards[1], { mark: "封", text: "封没封严", icon: "" });
  assert.equal(b.content.cards[2].icon, "lock");
  assert.equal(r.warnings.length, 2);
  // 解析结果可以直接被 normalizeEpisode 吃下
  const { episode } = normalizeEpisode({ number: r.number, title: r.title, beats: r.beats }, metaOf);
  assert.equal(episode.beats[0].content.stampStyle, "cross");
});

test("parseScript supports inline lists", () => {
  const r = parseScript("## 法则卡片\n法则卡: 干不干 / 封没封严 / 有没有怪味", { findTemplate });
  assert.equal(r.beats[0].content.cards.length, 3);
  assert.equal(r.beats[0].content.cards[2].mark, "有");
});

test("episodeToScript round-trips through parseScript", () => {
  const { episode } = normalizeEpisode(
    { number: 21, title: "回环", beats: [{ template: "rule-cards", code: "B1", title: "卡", content: { title: "三点", cards: [{ mark: "干", text: "干不干", icon: "damp" }, { mark: "封", text: "封严", icon: "lock" }] } }, { template: "hook-stamp", code: "B2", title: "钩", content: { stampStyle: "cross", show: true } }] },
    metaOf,
  );
  const text = episodeToScript(episode, metaOf);
  const r = parseScript(text, { findTemplate, iconOf });
  const back = normalizeEpisode({ number: r.number, title: r.title, beats: r.beats }, metaOf).episode;
  assert.equal(back.number, 21);
  assert.deepEqual(back.beats.map((b) => b.content), episode.beats.map((b) => b.content));
  assert.deepEqual(back.beats.map((b) => b.title), ["卡", "钩"]);
});
