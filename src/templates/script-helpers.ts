import { ICONS } from "./kit/icons";

/** 「潮气」「damp」「茶叶」→ 图标 key */
export function iconOf(name: string): string | undefined {
  const q = name.trim();
  if (!q) return "none";
  if (ICONS[q]) return q;
  const hit = Object.entries(ICONS).find(([, d]) => d.label === q || d.label.split(/\s*\/\s*/).includes(q) || d.label.includes(q));
  return hit?.[0];
}

export function iconLabel(key: string) {
  return ICONS[key]?.label.split(/\s*\/\s*/)[0] ?? key;
}

export const SCRIPT_EXAMPLE = `# 第20期 · 老白茶能不能煮

## B1 开门大字 | 破题
眉题: 很多人以为
误区大字: 老白茶都能煮
印章字: 不一定
扎心一句: 煮错了反而苦涩
时长: 9

## B2 法则卡片 | 三看
标题: 能不能煮，看三点
法则卡:
- 年 | 年份够不够 | 三年以上更适合 | 时间
- 料 | 是不是寿眉、贡眉 | 芽头多的不宜久煮 | 茶叶
- 器 | 用陶壶小火 | 别大火滚煮 | 茶壶

## B3 互动投票 | 互动
问题: 你喝老白茶，泡还是煮？
选项:
- 泡着喝 | 清爽
- 煮着喝 | 浓醇
行动号召: 评论区聊聊

## B4 收尾金句 | 收尾
金句: 会泡，再学煮
`;
