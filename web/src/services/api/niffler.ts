import { buildNifflerUrl, NIFFLER_ENABLED, NIFFLER_OPENAI_BASE_URL } from "@/constant/niffler";

export const NIFFLER_ACCESS_TOKEN_KEY = "access_token";
export const NIFFLER_CHANNEL_ID = "niffler";
const NIFFLER_DEVICE_ID_KEY = "aether_client_device_id";
const NIFFLER_API_KEY_ID_KEY = "infinite-canvas:niffler-api-key-id";

type NifflerProfile = {
    id: string;
    username: string;
    email?: string | null;
    preferences?: { avatar_url?: string };
};

type NifflerApiKey = {
    id: string;
    name: string;
    key?: string;
    is_active: boolean;
    is_locked: boolean;
};

export type NifflerApiKeyOption = Pick<NifflerApiKey, "id" | "name">;

type NifflerModel = {
    name: string;
    display_name?: string | null;
    is_active: boolean;
    supported_capabilities: string[] | Record<string, unknown> | null;
    config: Record<string, unknown> | null;
};

export type NifflerRuntime = {
    baseUrl: string;
    apiKey: string;
    apiKeyId: string;
    apiKeys: NifflerApiKeyOption[];
    models: string[];
    imageModels: string[];
    videoModels: string[];
    textModels: string[];
    audioModels: string[];
};

export type NifflerSession = {
    profile: NifflerProfile;
    runtime: NifflerRuntime;
};

export class NifflerApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
    }
}

export async function loginToNiffler(username: string, password: string) {
    const response = await request<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: username, password, auth_type: "local" }),
    }, false);
    localStorage.setItem(NIFFLER_ACCESS_TOKEN_KEY, response.access_token);
}

export async function logoutFromNiffler() {
    try {
        await request("/api/auth/logout", { method: "POST", body: "{}" }, false);
    } finally {
        localStorage.removeItem(NIFFLER_ACCESS_TOKEN_KEY);
    }
}

export async function loadNifflerSession(): Promise<NifflerSession> {
    if (!NIFFLER_ENABLED) throw new Error("当前环境未配置 Niffler");
    if (!localStorage.getItem(NIFFLER_ACCESS_TOKEN_KEY)) await refreshAccessToken();

    const [profile, keys, modelResponse] = await Promise.all([
        request<NifflerProfile>("/api/users/me"),
        request<NifflerApiKey[]>("/api/users/me/api-keys"),
        request<{ models: NifflerModel[] }>("/api/users/me/available-models?limit=1000"),
    ]);
    const activeKeys = keys.filter((key) => key.is_active && !key.is_locked);
    if (!activeKeys.length) activeKeys.push(await createNifflerApiKey());
    const selectedKeyId = localStorage.getItem(NIFFLER_API_KEY_ID_KEY);
    const activeKey = activeKeys.find((key) => key.id === selectedKeyId) || activeKeys[0];
    const apiKey = await readNifflerApiKey(activeKey);
    localStorage.setItem(NIFFLER_API_KEY_ID_KEY, activeKey.id);

    const models = modelResponse.models.filter((model) => model.is_active);
    const names = unique(models.map((model) => model.name));
    return {
        profile,
        runtime: {
            baseUrl: NIFFLER_OPENAI_BASE_URL,
            apiKey,
            apiKeyId: activeKey.id,
            apiKeys: activeKeys.map(({ id, name }) => ({ id, name })),
            models: names,
            imageModels: capabilityModels(models, "image"),
            videoModels: capabilityModels(models, "video"),
            textModels: capabilityModels(models, "text"),
            audioModels: capabilityModels(models, "audio"),
        },
    };
}

export async function selectNifflerApiKey(apiKeyId: string) {
    const credential = await request<NifflerApiKey>(`/api/users/me/api-keys/${apiKeyId}?include_key=true`);
    const apiKey = await readNifflerApiKey(credential);
    localStorage.setItem(NIFFLER_API_KEY_ID_KEY, apiKeyId);
    return apiKey;
}

async function createNifflerApiKey() {
    return request<NifflerApiKey>("/api/users/me/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: "LingWeave" }),
    });
}

async function readNifflerApiKey(apiKey: Pick<NifflerApiKey, "id" | "key">) {
    const credential = apiKey.key?.trim() ? apiKey : await request<{ key: string }>(`/api/users/me/api-keys/${apiKey.id}?include_key=true`);
    if (!credential.key?.trim()) throw new Error("Niffler 没有返回可用的 API 密钥");
    return credential.key;
}

async function refreshAccessToken() {
    const response = await request<{ access_token: string }>("/api/auth/refresh", { method: "POST" }, false);
    localStorage.setItem(NIFFLER_ACCESS_TOKEN_KEY, response.access_token);
}

async function request<T = unknown>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const token = localStorage.getItem(NIFFLER_ACCESS_TOKEN_KEY);
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (path.startsWith("/api/")) headers.set("X-Client-Device-Id", getClientDeviceId());
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(buildNifflerUrl(path), { ...init, headers, credentials: "include" });
    if (response.status === 401 && retry && !path.includes("/auth/")) {
        await refreshAccessToken();
        return request<T>(path, init, false);
    }
    if (!response.ok) throw new NifflerApiError(await responseError(response), response.status);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}

async function responseError(response: Response) {
    const fallback = response.status === 401 ? "请先登录 Niffler" : `Niffler 请求失败（${response.status}）`;
    try {
        const body = (await response.json()) as { detail?: unknown; message?: unknown; error?: unknown };
        return firstText(body.detail, body.message, body.error) || fallback;
    } catch {
        return fallback;
    }
}

function capabilityModels(models: NifflerModel[], capability: "image" | "video" | "text" | "audio") {
    const matched = models.filter((model) => hasCapability(model, capability)).map((model) => model.name);
    return unique(matched);
}

function hasCapability(model: NifflerModel, capability: "image" | "video" | "text" | "audio"): boolean {
    const values = Array.isArray(model.supported_capabilities)
        ? model.supported_capabilities
        : Object.entries(model.supported_capabilities || {}).filter(([, enabled]) => enabled !== false).map(([name]) => name);
    const configValues = Object.entries(model.config || {}).filter(([, enabled]) => enabled === true).map(([name]) => name);
    const haystack = [model.name, ...values, ...configValues].join(" ").toLowerCase();
    if (capability === "image") return /(image|dall-e|dalle|flux|sdxl|imagen|seedream|nano-banana)/.test(haystack);
    if (capability === "video") return /(video|sora|veo|kling|seedance|wan|hailuo)/.test(haystack);
    if (capability === "audio") return /(audio|tts|speech|voice|music|sound)/.test(haystack);
    return !hasCapability(model, "image") && !hasCapability(model, "video") && !hasCapability(model, "audio");
}

function firstText(...values: unknown[]) {
    return values.find((value): value is string => typeof value === "string" && Boolean(value.trim())) || "";
}

function unique(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getClientDeviceId() {
    const existing = localStorage.getItem(NIFFLER_DEVICE_ID_KEY);
    if (existing) return existing;
    const created = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(NIFFLER_DEVICE_ID_KEY, created);
    return created;
}
