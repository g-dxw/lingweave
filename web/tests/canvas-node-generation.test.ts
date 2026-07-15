import { describe, expect, it } from "vitest";

import { buildNodeGenerationContext } from "@/components/canvas/canvas-node-generation";
import { getMentionResourceNodes } from "@/lib/canvas/canvas-resource-references";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData, type CanvasNodeMetadata } from "@/types/canvas";

const createNode = (id: string, type: CanvasNodeType, metadata: CanvasNodeMetadata = {}): CanvasNodeData => ({ id, type, title: id, position: { x: 0, y: 0 }, width: 320, height: 240, metadata });
const connect = (id: string, fromNodeId: string, toNodeId: string): CanvasConnection => ({ id, fromNodeId, toNodeId });

describe("画布节点生成上下文", () => {
    const productImage = createNode("product", CanvasNodeType.Image, { content: "data:image/png;base64,product" });
    const forestPrompt = createNode("forest-prompt", CanvasNodeType.Text, { content: "森林穿越提示词" });
    const cityPrompt = createNode("city-prompt", CanvasNodeType.Text, { content: "城市穿行提示词" });
    const forestConfig = createNode("forest-config", CanvasNodeType.Config, { composerContent: "@[node:forest-prompt]\n@[node:product]" });
    const cityConfig = createNode("city-config", CanvasNodeType.Config, { composerContent: "@[node:city-prompt]\n@[node:product]" });
    const nodes = [productImage, forestPrompt, cityPrompt, forestConfig, cityConfig];
    const connections = [connect("product-forest", "product", "forest-config"), connect("forest-prompt-config", "forest-prompt", "forest-config"), connect("product-city", "product", "city-config"), connect("city-prompt-config", "city-prompt", "city-config")];

    it("直接从图片继续生成时不读取下游配置的提示词", () => {
        const context = buildNodeGenerationContext("product", nodes, connections, "未来科技感更强");

        expect(context.prompt).toBe("未来科技感更强");
        expect(context.textCount).toBe(0);
        expect(getMentionResourceNodes("product", nodes, connections).map((node) => node.id)).toEqual(["product"]);
    });

    it("从生成配置执行时仍读取其上游提示词和参考图", () => {
        const context = buildNodeGenerationContext("forest-config", nodes, connections, forestConfig.metadata?.composerContent || "");

        expect(context.prompt).toContain("森林穿越提示词");
        expect(context.prompt).not.toContain("城市穿行提示词");
        expect(context.textCount).toBe(1);
        expect(context.referenceImages.map((image) => image.id)).toEqual(["product"]);
    });
});
