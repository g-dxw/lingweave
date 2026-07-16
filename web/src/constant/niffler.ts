const configuredOrigin = (import.meta.env.VITE_NIFFLER_ORIGIN || "").trim().replace(/\/+$/, "");

export const NIFFLER_ENABLED = import.meta.env.DEV || Boolean(configuredOrigin);
export const NIFFLER_REQUEST_ORIGIN = import.meta.env.DEV ? "" : configuredOrigin;
export const NIFFLER_OPENAI_BASE_URL = NIFFLER_ENABLED ? `${NIFFLER_REQUEST_ORIGIN}/v1` : "";

export function buildNifflerUrl(path: string) {
    if (!NIFFLER_ENABLED) throw new Error("当前环境未配置 Niffler");
    return `${NIFFLER_REQUEST_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
