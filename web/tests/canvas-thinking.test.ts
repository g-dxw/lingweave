import { describe, expect, it } from "vitest";

import { buildNodeGenerationContext } from "@/components/canvas/canvas-node-generation";
import { buildThinkingPrompt, createThinkingBranch, normalizeThinkingCount, parseThinkingItems } from "@/lib/canvas/canvas-thinking";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData } from "@/types/canvas";

const root: CanvasNodeData = {
    id: "thinking-root",
    type: CanvasNodeType.Thinking,
    title: "AI 思维",
    position: { x: 100, y: 200 },
    width: 360,
    height: 280,
    metadata: { thinkingMode: "diverge", thinkingCount: 3 },
};
const items = [
    { title: "产品定位", content: "从产品定位解释目标用户与核心价值。" },
    { title: "使用场景", content: "从真实使用场景展示产品解决的问题。" },
    { title: "传播表达", content: "从品牌传播角度设计记忆点与行动号召。" },
];

describe("AI 思维节点", () => {
    it("限制子节点数量并生成不同结构的任务提示", () => {
        expect(normalizeThinkingCount(1)).toBe(2);
        expect(normalizeThinkingCount(20)).toBe(8);
        expect(buildThinkingPrompt("策划新品内容", "diverge", 3)).toContain("明显不同的角度");
        expect(buildThinkingPrompt("策划新品内容", "sequence", 3)).toContain("前后承接");
        expect(buildThinkingPrompt("策划新品内容", "outline", 3)).toContain("互不重叠");
    });

    it("校验结构化结果数量、标题和内容唯一性", () => {
        expect(parseThinkingItems({ items }, 3)).toEqual(items);
        expect(() => parseThinkingItems({ items: items.slice(0, 2) }, 3)).toThrow("实际返回 2 个");
        expect(() => parseThinkingItems({ items: [items[0], { ...items[1], title: items[0].title }, items[2]] }, 3)).toThrow("重复的思维节点标题");
        expect(() => parseThinkingItems({ items: [items[0], { ...items[1], content: items[0].content }, items[2]] }, 3)).toThrow("重复的思维节点内容");
    });

    it("自由发散和总分展开创建父子分支", () => {
        const branch = createThinkingBranch(root, items, "outline", "run-outline");

        expect(branch.nodes).toHaveLength(3);
        expect(branch.nodes.map((node) => node.position.x)).toEqual([556, 556, 556]);
        expect(branch.nodes.map((node) => node.metadata?.content)).toEqual(items.map((item) => item.content));
        expect(branch.nodes.every((node) => node.metadata?.thinkingRootId === root.id && node.metadata?.thinkingRunId === "run-outline")).toBe(true);
        expect(branch.connections.every((connection) => connection.fromNodeId === root.id)).toBe(true);
    });

    it("连贯序列创建有序标题和链式连接", () => {
        const branch = createThinkingBranch(root, items, "sequence", "run-sequence");

        expect(branch.nodes.map((node) => node.title)).toEqual(["01 · 产品定位", "02 · 使用场景", "03 · 传播表达"]);
        expect(branch.nodes[1].position.x).toBeGreaterThan(branch.nodes[0].position.x);
        expect(branch.connections.map(({ fromNodeId, toNodeId }) => [fromNodeId, toNodeId])).toEqual([
            [root.id, branch.nodes[0].id],
            [branch.nodes[0].id, branch.nodes[1].id],
            [branch.nodes[1].id, branch.nodes[2].id],
        ]);
    });

    it("重复运行时把新结果放到相邻空白区域", () => {
        const first = createThinkingBranch(root, items, "outline", "run-1", 0);
        const second = createThinkingBranch(root, items, "outline", "run-2", 1);
        const firstSequence = createThinkingBranch(root, items, "sequence", "sequence-1", 0);
        const secondSequence = createThinkingBranch(root, items, "sequence", "sequence-2", 1);

        expect(second.nodes[0].position.x).toBeGreaterThan(first.nodes[0].position.x);
        expect(secondSequence.nodes[0].position.y).toBeGreaterThan(firstSequence.nodes[0].position.y);
    });

    it("只读取指向当前思维节点的入线文本", () => {
        const topic = { ...root, id: "topic", type: CanvasNodeType.Text, metadata: { content: "共同主题" } };
        const other = { ...root, id: "other", type: CanvasNodeType.Text, metadata: { content: "其他分支内容" } };
        const secondThinking = { ...root, id: "second-thinking" };
        const connections: CanvasConnection[] = [
            { id: "topic-first", fromNodeId: topic.id, toNodeId: root.id },
            { id: "topic-second", fromNodeId: topic.id, toNodeId: secondThinking.id },
            { id: "other-second", fromNodeId: other.id, toNodeId: secondThinking.id },
        ];

        const firstContext = buildNodeGenerationContext(root.id, [topic, other, root, secondThinking], connections, "发散目标");
        const secondContext = buildNodeGenerationContext(secondThinking.id, [topic, other, root, secondThinking], connections, "发散目标");

        expect(firstContext.prompt).toContain("共同主题");
        expect(firstContext.prompt).not.toContain("其他分支内容");
        expect(secondContext.prompt).toContain("共同主题");
        expect(secondContext.prompt).toContain("其他分支内容");
    });
});
