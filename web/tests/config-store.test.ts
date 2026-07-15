import { beforeEach, describe, expect, it } from "vitest";

import { NIFFLER_CHANNEL_ID, type NifflerRuntime } from "@/services/api/niffler";
import {
    buildApiUrl,
    createModelChannel,
    defaultConfig,
    encodeChannelModel,
    getEffectiveConfig,
    modelOptionName,
    modelOptionsFromChannels,
    resolveModelRequestConfig,
    useConfigStore,
} from "@/stores/use-config-store";
import { useNifflerStore } from "@/stores/use-niffler-store";

const emptyNifflerModels = { model: "", imageModel: "", videoModel: "", textModel: "", audioModel: "" };

beforeEach(() => {
    window.localStorage.clear();
    useNifflerStore.setState({ status: "idle", session: null, runtime: null, error: "", loginOpen: false, selectingKey: false });
    useConfigStore.setState({ config: structuredClone(defaultConfig), nifflerModels: emptyNifflerModels });
});

describe("API URL", () => {
    it("为普通 OpenAI 地址补充 v1", () => {
        expect(buildApiUrl("https://api.example.com/", "/models")).toBe("https://api.example.com/v1/models");
        expect(buildApiUrl("https://api.example.com/v1", "/images/generations")).toBe("https://api.example.com/v1/images/generations");
    });

    it("规范化火山方舟 Agent Plan 地址", () => {
        expect(buildApiUrl("https://ark.example.com/api/plan/v3/unused?token=ignored", "/contents/generations/tasks")).toBe("https://ark.example.com/api/plan/v3/contents/generations/tasks");
    });
});

describe("模型渠道", () => {
    it("按编码后的模型选择正确渠道", () => {
        const channels = [
            createModelChannel({ id: "first", baseUrl: "https://first.example.com", apiKey: "first-key", models: ["shared-model"] }),
            createModelChannel({ id: "second", baseUrl: "https://second.example.com", apiKey: "second-key", models: ["shared-model"] }),
        ];
        const config = { ...structuredClone(defaultConfig), channels, models: modelOptionsFromChannels(channels) };
        const requestConfig = resolveModelRequestConfig(config, encodeChannelModel("second", "shared-model"));

        expect(requestConfig.model).toBe("shared-model");
        expect(requestConfig.baseUrl).toBe("https://second.example.com");
        expect(requestConfig.apiKey).toBe("second-key");
    });

    it("登录后返回 Niffler 有效配置并保留用户选择", () => {
        const runtime: NifflerRuntime = {
            baseUrl: "https://canvas.example.com",
            apiKey: "runtime-secret",
            apiKeyId: "key-1",
            apiKeys: [{ id: "key-1", name: "主 Key" }],
            models: ["image-a", "image-b", "text-a"],
            imageModels: ["image-a", "image-b"],
            videoModels: [],
            textModels: ["text-a"],
            audioModels: [],
        };
        useNifflerStore.setState({ runtime });
        useConfigStore.getState().applyNifflerModels(runtime);
        useConfigStore.getState().updateConfig("imageModel", encodeChannelModel(NIFFLER_CHANNEL_ID, "image-b"));

        const config = getEffectiveConfig();
        expect(config.apiKey).toBe("runtime-secret");
        expect(config.channels).toHaveLength(1);
        expect(config.channels[0].id).toBe(NIFFLER_CHANNEL_ID);
        expect(modelOptionName(config.imageModel)).toBe("image-b");
        expect(useConfigStore.getState().config.apiKey).toBe("");
    });

    it("持久化模型选择但不持久化 Niffler 运行时凭证", () => {
        const selection = { ...emptyNifflerModels, imageModel: encodeChannelModel(NIFFLER_CHANNEL_ID, "image-b") };
        useConfigStore.setState({ nifflerModels: selection });
        const partialize = useConfigStore.persist.getOptions().partialize;
        const persisted = partialize?.(useConfigStore.getState()) as Record<string, unknown>;

        expect(persisted.nifflerModels).toEqual(selection);
        expect(persisted).not.toHaveProperty("runtime");
        expect(JSON.stringify(persisted)).not.toContain("runtime-secret");
    });
});
