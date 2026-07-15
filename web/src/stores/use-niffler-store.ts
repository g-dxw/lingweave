import { create } from "zustand";

import { loadNifflerSession, loginToNiffler, logoutFromNiffler, NifflerApiError, selectNifflerApiKey, type NifflerRuntime, type NifflerSession } from "@/services/api/niffler";

type NifflerStatus = "idle" | "loading" | "ready" | "unauthenticated" | "error";

type NifflerStore = {
    status: NifflerStatus;
    session: NifflerSession | null;
    runtime: NifflerRuntime | null;
    error: string;
    loginOpen: boolean;
    selectingKey: boolean;
    bootstrap: () => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setLoginOpen: (loginOpen: boolean) => void;
    selectApiKey: (apiKeyId: string) => Promise<void>;
};

let bootstrapPromise: Promise<void> | null = null;

export const useNifflerStore = create<NifflerStore>()((set, get) => ({
    status: "idle",
    session: null,
    runtime: null,
    error: "",
    loginOpen: false,
    selectingKey: false,
    bootstrap: async () => {
        if (get().status === "ready") return;
        if (bootstrapPromise) return bootstrapPromise;
        bootstrapPromise = (async () => {
            set({ status: "loading", error: "" });
            try {
                const session = await loadNifflerSession();
                set({ status: "ready", session, runtime: session.runtime, error: "", loginOpen: false });
            } catch (error) {
                const unauthenticated = isUnauthenticated(error);
                set({ status: unauthenticated ? "unauthenticated" : "error", session: null, runtime: null, error: unauthenticated ? "" : error instanceof Error ? error.message : "无法连接 Niffler" });
            }
        })().finally(() => {
            bootstrapPromise = null;
        });
        return bootstrapPromise;
    },
    login: async (username, password) => {
        set({ status: "loading", error: "" });
        try {
            await loginToNiffler(username, password);
            const session = await loadNifflerSession();
            set({ status: "ready", session, runtime: session.runtime, error: "", loginOpen: false });
        } catch (error) {
            set({ status: "unauthenticated", session: null, runtime: null, error: error instanceof Error ? error.message : "登录失败" });
        }
    },
    logout: async () => {
        set({ status: "loading", session: null, runtime: null, error: "" });
        try {
            await logoutFromNiffler();
        } finally {
            set({ status: "unauthenticated", session: null, runtime: null, error: "" });
        }
    },
    setLoginOpen: (loginOpen) => set({ loginOpen, error: loginOpen ? get().error : "" }),
    selectApiKey: async (apiKeyId) => {
        const session = get().session;
        if (!session || session.runtime.apiKeyId === apiKeyId) return;
        set({ selectingKey: true, error: "" });
        try {
            const apiKey = await selectNifflerApiKey(apiKeyId);
            const runtime = { ...session.runtime, apiKeyId, apiKey };
            set({ runtime, session: { ...session, runtime } });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : "切换 API Key 失败" });
            throw error;
        } finally {
            set({ selectingKey: false });
        }
    },
}));

function isUnauthenticated(error: unknown) {
    return error instanceof NifflerApiError && (error.status === 401 || error.status === 403 || error.message.includes("刷新令牌"));
}
