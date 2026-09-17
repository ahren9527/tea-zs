import { createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: Login,
  codeSplitGroupings: [],
});

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-chrome px-6 text-chrome-fg">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <p className="font-display text-sm tracking-[0.18em] text-chrome-muted">正上茶舍</p>
          <h1 className="mt-1 font-display text-2xl">登录动画台</h1>
        </div>
        {authEnabled ? (
          GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              className="w-full rounded-sm border border-chrome-line px-4 py-3 text-sm transition-colors hover:bg-surface"
            >
              使用 {p.label} 继续
            </button>
          ))
        ) : (
          <p className="text-sm text-chrome-muted">登录已关闭。</p>
        )}
        <a href="/" className="block text-sm text-chrome-muted hover:text-chrome-fg">
          返回动画台
        </a>
      </div>
    </main>
  );
}
