import { afterEach, describe, expect, it, vi } from "vitest";

import { requestStructuredText } from "@/services/api/image";
import { defaultConfig } from "@/stores/use-config-store";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("结构化文本流式响应", () => {
    it("从函数调用流事件读取参数，即使 completed.output 为空", async () => {
        const argumentsValue = JSON.stringify({ items: [{ title: "方向一", content: "完整内容" }] });
        const stream = [
            `data: ${JSON.stringify({ type: "response.output_item.added", item: { id: "fc_1", type: "function_call", call_id: "call_1", name: "create_thinking_nodes", arguments: "" } })}`,
            `data: ${JSON.stringify({ type: "response.function_call_arguments.delta", item_id: "fc_1", delta: argumentsValue.slice(0, 12) })}`,
            `data: ${JSON.stringify({ type: "response.function_call_arguments.delta", item_id: "fc_1", delta: argumentsValue.slice(12) })}`,
            `data: ${JSON.stringify({ type: "response.function_call_arguments.done", item_id: "fc_1", arguments: argumentsValue })}`,
            `data: ${JSON.stringify({ type: "response.completed", response: { output: [] } })}`,
        ].join("\n\n");
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } })));
        const config = {
            ...defaultConfig,
            model: "gpt-test",
            textModel: "gpt-test",
            channels: [{ id: "test", name: "测试", baseUrl: "https://example.com/v1", apiKey: "test-key", apiFormat: "openai" as const, models: ["gpt-test"] }],
        };

        const result = await requestStructuredText<{ items: Array<{ title: string; content: string }> }>(config, [{ role: "user", content: "测试" }], {
            name: "create_thinking_nodes",
            parameters: { type: "object" },
        });

        expect(result).toEqual({ items: [{ title: "方向一", content: "完整内容" }] });
    });
});
