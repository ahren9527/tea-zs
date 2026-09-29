import { framesOf } from "@/remotion/shared/theme";

export type KeyframeMarker = {
  frame: number;
  timeSec: number;
  label: string;
  tag: string;
  type: "intro" | "action" | "stamp" | "punchline";
};

export type ClipTextSchema = {
  key: string;
  label: string;
  default: string;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "stamp";
};

export const CLIP_CONFIGS: Record<
  string,
  {
    markers: KeyframeMarker[];
    fields: ClipTextSchema[];
  }
> = {
  "ep18-b1": {
    markers: [
      { frame: framesOf(2.0), timeSec: 2.0, label: "破题反差", tag: "引言", type: "intro" },
      { frame: framesOf(5.2), timeSec: 5.2, label: "毁茶印章", tag: "盖印", type: "stamp" },
      { frame: framesOf(7.6), timeSec: 7.6, label: "陈化扎心", tag: "金句", type: "punchline" },
    ],
    fields: [
      { key: "myth", label: "认知误区 (大字)", default: "越放越香", placeholder: "例如: 越放越香" },
      { key: "stamp", label: "警示印章 (2-4字)", default: "毁茶", placeholder: "例如: 毁茶 / 变味", type: "stamp" },
      { key: "line", label: "扎心反问 (后段)", default: "你以为在陈化", placeholder: "例如: 你以为在陈化" },
    ],
  },
  "ep18-b2": {
    markers: [
      { frame: framesOf(0.4), timeSec: 0.4, label: "法则一: 干", tag: "法则", type: "action" },
      { frame: framesOf(2.6), timeSec: 2.6, label: "法则二: 封", tag: "法则", type: "action" },
      { frame: framesOf(4.9), timeSec: 4.9, label: "法则三: 净", tag: "法则", type: "action" },
    ],
    fields: [
      { key: "card1", label: "法则一 (干)", default: "干不干", placeholder: "干不干" },
      { key: "card2", label: "法则二 (封)", default: "封没封严", placeholder: "封没封严" },
      { key: "card3", label: "法则三 (净)", default: "有没有怪味", placeholder: "有没有怪味" },
    ],
  },
  "ep18-b3": {
    markers: [
      { frame: framesOf(0.3), timeSec: 0.3, label: "核心大字: 干", tag: "开门", type: "intro" },
      { frame: framesOf(2.8), timeSec: 2.8, label: "吸潮辨析", tag: "辨析", type: "action" },
      { frame: framesOf(5.0), timeSec: 5.0, label: "发霉警示", tag: "盖印", type: "stamp" },
      { frame: framesOf(10.0), timeSec: 10.0, label: "除湿机建议", tag: "行动", type: "action" },
      { frame: framesOf(13.2), timeSec: 13.2, label: "切忌冰箱", tag: "禁忌", type: "punchline" },
    ],
    fields: [
      { key: "title", label: "主题字", default: "干", placeholder: "干" },
      { key: "myth", label: "辨析点", default: "吸潮≠变醇", placeholder: "吸潮≠变醇" },
      { key: "warning", label: "变质后果", default: "发酸发霉", placeholder: "发酸发霉" },
      { key: "solution", label: "实操方案", default: "梅雨季节除湿机", placeholder: "梅雨季节除湿机" },
      { key: "taboo", label: "绝对禁忌", default: "别塞冰箱", placeholder: "别塞冰箱" },
    ],
  },
  "ep18-b4": {
    markers: [
      { frame: framesOf(0.3), timeSec: 0.3, label: "核心大字: 封", tag: "开门", type: "intro" },
      { frame: framesOf(4.6), timeSec: 4.6, label: "紫砂误区", tag: "警示", type: "stamp" },
      { frame: framesOf(8.8), timeSec: 8.8, label: "铝箔袋层", tag: "步骤1", type: "action" },
      { frame: framesOf(10.6), timeSec: 10.6, label: "塑料袋层", tag: "步骤2", type: "action" },
      { frame: framesOf(12.4), timeSec: 12.4, label: "原包装箱", tag: "步骤3", type: "action" },
    ],
    fields: [
      { key: "title", label: "主题字", default: "封", placeholder: "封" },
      { key: "taboo", label: "避坑容器", default: "紫砂不能用", placeholder: "紫砂不能用" },
      { key: "layer1", label: "密封第一层", default: "铝箔袋", placeholder: "铝箔袋" },
      { key: "layer2", label: "密封第二层", default: "塑料袋", placeholder: "塑料袋" },
      { key: "layer3", label: "密封第三层", default: "纸箱密封", placeholder: "纸箱密封" },
    ],
  },
  "ep18-b5": {
    markers: [
      { frame: framesOf(0.3), timeSec: 0.3, label: "核心大字: 净", tag: "开门", type: "intro" },
      { frame: framesOf(2.6), timeSec: 2.6, label: "油烟入侵", tag: "污染", type: "action" },
      { frame: framesOf(4.2), timeSec: 4.2, label: "潮气吸附", tag: "污染", type: "action" },
      { frame: framesOf(5.8), timeSec: 5.8, label: "樟脑丸吸味", tag: "死敌", type: "punchline" },
    ],
    fields: [
      { key: "title", label: "主题字", default: "净", placeholder: "净" },
      { key: "bad1", label: "异味敌源1", default: "油烟", placeholder: "油烟" },
      { key: "bad2", label: "异味敌源2", default: "潮气", placeholder: "潮气" },
      { key: "bad3", label: "异味敌源3", default: "樟脑丸", placeholder: "樟脑丸" },
    ],
  },
  "ep18-b6": {
    markers: [
      { frame: framesOf(0.3), timeSec: 0.3, label: "六字法则引言", tag: "引言", type: "intro" },
      { frame: framesOf(1.6), timeSec: 1.6, label: "够干印章", tag: "印1", type: "stamp" },
      { frame: framesOf(3.0), timeSec: 3.0, label: "封死印章", tag: "印2", type: "stamp" },
      { frame: framesOf(4.4), timeSec: 4.4, label: "没味印章", tag: "印3", type: "stamp" },
    ],
    fields: [
      { key: "w1", label: "印章一", default: "够干", placeholder: "够干", type: "stamp" },
      { key: "w2", label: "印章二", default: "封死", placeholder: "封死", type: "stamp" },
      { key: "w3", label: "印章三", default: "没味", placeholder: "没味", type: "stamp" },
    ],
  },
  "ep18-b7": {
    markers: [
      { frame: framesOf(0.4), timeSec: 0.4, label: "问题引导", tag: "发问", type: "intro" },
      { frame: framesOf(2.6), timeSec: 2.6, label: "选项 A 现喝", tag: "选项A", type: "action" },
      { frame: framesOf(4.8), timeSec: 4.8, label: "选项 B 分装", tag: "选项B", type: "action" },
      { frame: framesOf(7.6), timeSec: 7.6, label: "评论区互动", tag: "互动", type: "punchline" },
    ],
    fields: [
      { key: "question", label: "互动提问", default: "怎么喝", placeholder: "怎么喝" },
      { key: "optA", label: "选项 A", default: "现喝现撬", placeholder: "现喝现撬" },
      { key: "optB", label: "选项 B", default: "提前分装", placeholder: "提前分装" },
      { key: "cta", label: "行动号召", default: "评论区聊聊", placeholder: "评论区聊聊" },
    ],
  },
  "ep18-b8": {
    markers: [
      { frame: framesOf(0.2), timeSec: 0.2, label: "茶仓环境", tag: "环境", type: "intro" },
      { frame: framesOf(1.6), timeSec: 1.6, label: "离墙一尺", tag: "要点1", type: "action" },
      { frame: framesOf(5.2), timeSec: 5.2, label: "离地半尺", tag: "要点2", type: "action" },
      { frame: framesOf(8.6), timeSec: 8.6, label: "架起来放", tag: "要点3", type: "stamp" },
    ],
    fields: [
      { key: "rule1", label: "仓储口诀1", default: "离墙一尺", placeholder: "离墙一尺" },
      { key: "rule2", label: "仓储口诀2", default: "离地半尺", placeholder: "离地半尺" },
      { key: "action", label: "终极动作", default: "架起来放", placeholder: "架起来放" },
    ],
  },
  "ep18-b9": {
    markers: [
      { frame: framesOf(0.25), timeSec: 0.25, label: "飞入动作", tag: "飞入", type: "intro" },
      { frame: framesOf(2.0), timeSec: 2.0, label: "收尾大金句", tag: "定格", type: "punchline" },
    ],
    fields: [
      { key: "line", label: "收尾金句全文", default: "先存对，再谈老", placeholder: "先存对，再谈老" },
    ],
  },
  "ep18-b10": {
    markers: [
      { frame: framesOf(0.4), timeSec: 0.4, label: "开篇总纲", tag: "标题", type: "intro" },
      { frame: framesOf(1.8), timeSec: 1.8, label: "大罐登场", tag: "主仓", type: "action" },
      { frame: framesOf(5.0), timeSec: 5.0, label: "小罐登场", tag: "随喝", type: "action" },
      { frame: framesOf(7.4), timeSec: 7.4, label: "流转过渡", tag: "取用", type: "action" },
      { frame: framesOf(9.2), timeSec: 9.2, label: "定论口诀", tag: "口诀", type: "punchline" },
    ],
    fields: [
      { key: "title", label: "核心主题", default: "大罐存 · 小罐醒", placeholder: "大罐存 · 小罐醒" },
      { key: "bigLabel", label: "大罐主标", default: "大罐长期封存", placeholder: "大罐长期封存" },
      { key: "bigSub", label: "大罐要义", default: "避光密封 · 静置陈化", placeholder: "避光密封 · 静置陈化" },
      { key: "smallLabel", label: "小罐主标", default: "小罐日常慢醒", placeholder: "小罐日常慢醒" },
      { key: "smallSub", label: "小罐要义", default: "按周取用 · 唤醒茶香", placeholder: "按周取用 · 唤醒茶香" },
      { key: "foot", label: "总结口诀", default: "分工明确 · 滋味常新", placeholder: "分工明确 · 滋味常新" },
    ],
  },
  // --- Ep 19 Clips ---
  "ep19-b1": {
    markers: [
      { frame: 0, timeSec: 0, label: "定性入场", tag: "入场", type: "intro" },
      { frame: framesOf(1.0), timeSec: 1.0, label: "✖印撞击", tag: "盖印", type: "stamp" },
      { frame: framesOf(1.8), timeSec: 1.8, label: "大袋拉开", tag: "开袋", type: "action" },
      { frame: framesOf(2.2), timeSec: 2.2, label: "香气流失", tag: "🍃升腾", type: "action" },
      { frame: framesOf(2.9), timeSec: 2.9, label: "潮气钻入", tag: "💧入侵", type: "action" },
      { frame: framesOf(3.2), timeSec: 3.2, label: "数据骤降", tag: "跌落", type: "action" },
      { frame: framesOf(5.2), timeSec: 5.2, label: "锁死23%", tag: "警示", type: "punchline" },
      { frame: framesOf(6.8), timeSec: 6.8, label: "留白呼吸", tag: "定格", type: "intro" },
    ],
    fields: [
      { key: "title", label: "定性主词", default: "频繁开大袋", placeholder: "频繁开大袋" },
      { key: "crossMark", label: "警示印章", default: "✖", placeholder: "✖", type: "stamp" },
    ],
  },
  "ep19-b4-1": {
    markers: [
      { frame: 0, timeSec: 0, label: "剖面底境", tag: "基底", type: "intro" },
      { frame: framesOf(0.75), timeSec: 0.75, label: "金光直射", tag: "光束", type: "action" },
      { frame: framesOf(1.05), timeSec: 1.05, label: "釉面散射", tag: "折射", type: "action" },
      { frame: framesOf(1.25), timeSec: 1.25, label: "避光印章", tag: "盖印", type: "stamp" },
      { frame: framesOf(1.8), timeSec: 1.8, label: "木盖压下", tag: "下压", type: "action" },
      { frame: framesOf(2.2), timeSec: 2.2, label: "硅胶挤压", tag: "形变", type: "action" },
      { frame: framesOf(2.65), timeSec: 2.65, label: "合盖锁紧", tag: "气密", type: "action" },
      { frame: framesOf(2.7), timeSec: 2.7, label: "聚香光球", tag: "锁香", type: "punchline" },
      { frame: framesOf(2.8), timeSec: 2.8, label: "密封印章", tag: "盖印", type: "stamp" },
    ],
    fields: [
      { key: "lightStamp", label: "避光印章", default: "避光 ✔", placeholder: "避光 ✔", type: "stamp" },
      { key: "sealStamp", label: "密封印章", default: "密封 ✔", placeholder: "密封 ✔", type: "stamp" },
    ],
  },
  "ep19-b4-2": {
    markers: [
      { frame: 0, timeSec: 0, label: "双罐对立", tag: "对决", type: "intro" },
      { frame: framesOf(0.5), timeSec: 0.5, label: "斜射金光", tag: "光束", type: "action" },
      { frame: framesOf(0.8), timeSec: 0.8, label: "光气双测", tag: "测试", type: "action" },
      { frame: framesOf(0.9), timeSec: 0.9, label: "右罐焦枯", tag: "变色", type: "action" },
      { frame: framesOf(0.85), timeSec: 0.85, label: "左罐聚香", tag: "锁香", type: "punchline" },
      { frame: framesOf(2.0), timeSec: 2.0, label: "引线标牌", tag: "引线", type: "action" },
      { frame: framesOf(2.4), timeSec: 2.4, label: "双印落地", tag: "标牌", type: "stamp" },
      { frame: framesOf(3.2), timeSec: 3.2, label: "锁香定格", tag: "定格", type: "punchline" },
    ],
    fields: [
      { key: "leftStamp", label: "左罐标牌", default: "瓷·铁 锁香 ✔", placeholder: "瓷·铁 锁香 ✔", type: "stamp" },
      { key: "rightStamp", label: "右罐标牌", default: "砂·玻 见光死 ✖", placeholder: "砂·玻 见光死 ✖", type: "stamp" },
    ],
  },
  "ep19-b5-1": {
    markers: [
      { frame: 0, timeSec: 0, label: "标题起幅", tag: "起幅", type: "intro" },
      { frame: framesOf(0.4), timeSec: 0.4, label: "印章落墨", tag: "印章", type: "stamp" },
      { frame: framesOf(0.7), timeSec: 0.7, label: "烟气扩散", tag: "对流", type: "action" },
      { frame: framesOf(1.4), timeSec: 1.4, label: "茶叶变质", tag: "受污", type: "action" },
      { frame: framesOf(2.2), timeSec: 2.2, label: "引线向下", tag: "引线", type: "action" },
      { frame: framesOf(2.4), timeSec: 2.4, label: "标牌落幅", tag: "标牌", type: "stamp" },
      { frame: framesOf(3.6), timeSec: 3.6, label: "警示定格", tag: "定格", type: "punchline" },
    ],
    fields: [
      { key: "title", label: "顶部标题", default: "雷区一：极易吸味", placeholder: "雷区一：极易吸味", type: "heading" },
      { key: "stamp", label: "底部标牌", default: "避开厨房油烟", placeholder: "避开厨房油烟", type: "stamp" },
    ],
  },
  "ep19-b5-2": {
    markers: [
      { frame: 0, timeSec: 0, label: "标题起幅", tag: "起幅", type: "intro" },
      { frame: framesOf(0.4), timeSec: 0.4, label: "印章落印", tag: "印章", type: "stamp" },
      { frame: framesOf(0.8), timeSec: 0.8, label: "湿度飙升", tag: "警示", type: "action" },
      { frame: framesOf(1.4), timeSec: 1.4, label: "水汽直灌", tag: "受潮", type: "action" },
      { frame: framesOf(2.4), timeSec: 2.4, label: "标牌落幅", tag: "标牌", type: "stamp" },
      { frame: framesOf(3.4), timeSec: 3.4, label: "定格警示", tag: "定格", type: "punchline" },
    ],
    fields: [
      { key: "title", label: "顶部标题", default: "雷区二：梅雨大开", placeholder: "雷区二：梅雨大开" },
      { key: "stamp", label: "底部标牌", default: "梅雨忌大开补茶 ✖", placeholder: "梅雨忌大开补茶 ✖", type: "stamp" },
    ],
  },
  "ep19-b6-1": {
    markers: [
      { frame: 0, timeSec: 0, label: "双境初启", tag: "起幅", type: "intro" },
      { frame: framesOf(0.4), timeSec: 0.4, label: "主标砸落", tag: "印章", type: "stamp" },
      { frame: framesOf(0.8), timeSec: 0.8, label: "经年沉淀", tag: "年份", type: "action" },
      { frame: framesOf(1.1), timeSec: 1.1, label: "晨曦苏醒", tag: "醒茶", type: "action" },
      { frame: framesOf(1.8), timeSec: 1.8, label: "仓台对照", tag: "准则", type: "stamp" },
      { frame: framesOf(3.2), timeSec: 3.2, label: "定格收束", tag: "定格", type: "punchline" },
    ],
    fields: [
      { key: "title", label: "居中主标", default: "大罐睡觉 · 小罐上班", placeholder: "大罐睡觉 · 小罐上班" },
      { key: "stamp", label: "主标印章", default: "准则", placeholder: "准则", type: "stamp" },
    ],
  },
};

export function getMarkersForClip(clipId: string): KeyframeMarker[] {
  return CLIP_CONFIGS[clipId]?.markers ?? [];
}

export function getFieldsForClip(clipId: string): ClipTextSchema[] {
  return CLIP_CONFIGS[clipId]?.fields ?? [];
}

export function getDefaultTextsForClip(clipId: string): Record<string, string> {
  const fields = getFieldsForClip(clipId);
  const map: Record<string, string> = {};
  for (const f of fields) {
    map[f.key] = f.default;
  }
  return map;
}
