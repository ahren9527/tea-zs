const iconCache = new Map<string, HTMLImageElement>();

export function getIconImage(src: string) {
  return iconCache.get(src);
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
