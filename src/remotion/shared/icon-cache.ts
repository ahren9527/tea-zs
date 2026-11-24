const iconCache = new Map<string, HTMLImageElement>();

const registered = new Set<string>();

/** 节拍模块声明自己要用的图片；面板启动和导出前会统一预加载 */
export function registerImages(paths: string[]): string[] {
  paths.forEach((p) => registered.add(p));
  return paths;
}

export function registeredImages(): string[] {
  return [...registered];
}

export function getIconImage(src: string) {
  const hit = iconCache.get(src);
  // 浏览器里没预加载到的图，第一次取时顺手加载，下一帧就能画上
  if (!hit && typeof document !== "undefined") void preloadIconList([src]);
  return hit;
}

export function preloadIconList(paths: string[]): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  return Promise.all(
    paths.map(
      (src) =>
        new Promise<void>((resolve) => {
          const hit = iconCache.get(src);
          if (hit?.complete && hit.naturalWidth > 0) {
            resolve();
            return;
          }
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            iconCache.set(src, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `/${src}`;
          iconCache.set(src, img);
        }),
    ),
  ).then(() => undefined);
}

/** 离线渲染（node）时手动放入已解码的图片。 */
export function setIconImage(src: string, img: HTMLImageElement) {
  iconCache.set(src, img);
}
