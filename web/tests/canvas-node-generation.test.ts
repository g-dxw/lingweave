import { describe, expect, it } from "vitest";

import { buildNodeGenerationContext } from "@/components/canvas/canvas-node-generation";
import { getMentionResourceNodes } from "@/lib/canvas/canvas-resource-references";
import { buildImageReferencePromptText } from "@/lib/image-reference-prompt";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData, type CanvasNodeMetadata } from "@/types/canvas";

const createNode = (id: string, type: CanvasNodeType, metadata: CanvasNodeMetadata = {}, title = id): CanvasNodeData => ({ id, type, title, position: { x: 0, y: 0 }, width: 320, height: 240, metadata });
const connect = (id: string, fromNodeId: string, toNodeId: string): CanvasConnection => ({ id, fromNodeId, toNodeId });

describe("画布节点生成上下文", () => {
    const productImage = createNode("product", CanvasNodeType.Image, { content: "data:image/png;base64,product" });
    const forestPrompt = createNode("forest-prompt", CanvasNodeType.Text, { content: "森林穿越提示词" });
    const cityPrompt = createNode("city-prompt", CanvasNodeType.Text, { content: "城市穿行提示词" });
    const forestConfig = createNode("forest-config", CanvasNodeType.Config, { composerContent: "@[node:forest-prompt]\n@[node:product]" });
    const cityConfig = createNode("city-config", CanvasNodeType.Config, { composerContent: "@[node:city-prompt]\n@[node:product]" });
    const nodes = [productImage, forestPrompt, cityPrompt, forestConfig, cityConfig];
    const connections = [
        connect("product-forest", "product", "forest-config"),
        connect("forest-prompt-config", "forest-prompt", "forest-config"),
        connect("product-city", "product", "city-config"),
        connect("city-prompt-config", "city-prompt", "city-config"),
    ];

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

    it("按模板首次引用顺序生成结构化提示词并保持文本原文", () => {
        const copy = createNode("copy", CanvasNodeType.Text, { content: "一个平台，管好养老机构的每一天\n\n01 长者全周期档案\n02 床位与入住管理" }, "核心能力");
        const config = createNode("config", CanvasNodeType.Config, { composerContent: "参考图片：@[node:product]\n文案：@[node:copy]\n根据参考图片生成文案的效果图" });
        const context = buildNodeGenerationContext("config", [copy, productImage, config], [connect("copy-config", "copy", "config"), connect("product-config", "product", "config")], config.metadata?.composerContent || "");

        expect(context.prompt).toBe(`【任务说明】
参考图片：【图片1】
文案：【文本1】
根据参考图片生成文案的效果图

【参考素材】
【图片1】对应上传的第 1 张图片。

【引用文本】
【文本1｜核心能力】
一个平台，管好养老机构的每一天

01 长者全周期档案
02 床位与入住管理`);
        expect(context.referenceImages.map((image) => image.id)).toEqual(["product"]);
        expect(buildImageReferencePromptText(context.prompt, context.referenceImages)).toBe(context.prompt);
    });

    it("多个素材按首次引用编号且重复文本只附加一次正文", () => {
        const secondImage = createNode("second-image", CanvasNodeType.Image, { content: "data:image/png;base64,second" });
        const copy = createNode("copy", CanvasNodeType.Text, { content: "必须保持原样的文案" }, "主文案");
        const config = createNode("config", CanvasNodeType.Config, { composerContent: "先参考 @[node:second-image]，再参考 @[node:product]。使用 @[node:copy]，并再次确认 @[node:copy]。" });
        const context = buildNodeGenerationContext(
            "config",
            [productImage, copy, secondImage, config],
            [connect("product-config", "product", "config"), connect("copy-config", "copy", "config"), connect("second-config", "second-image", "config")],
            config.metadata?.composerContent || "",
        );

        expect(context.referenceImages.map((image) => image.id)).toEqual(["second-image", "product"]);
        expect(context.prompt).toContain("先参考 【图片1】，再参考 【图片2】。使用 【文本1】，并再次确认 【文本1】。");
        expect(context.prompt).toContain("【图片1】对应上传的第 1 张图片。\n【图片2】对应上传的第 2 张图片。");
        expect(context.prompt.split(copy.metadata?.content || "")).toHaveLength(2);
    });
});
