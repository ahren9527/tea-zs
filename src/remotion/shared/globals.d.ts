// 第 19 期部分片段把 GSAP 时间轴挂到 window 上便于调试
export {};
declare global {
  interface Window {
    __timelines?: Record<string, unknown>;
  }
}
