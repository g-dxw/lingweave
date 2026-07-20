import { nanoid } from "nanoid";

import { NODE_DEFAULT_SIZE } from "@/constant/canvas";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData, type CanvasThinkingMode } from "@/types/canvas";

export const THINKING_COUNT_MIN = 2;
export const THINKING_COUNT_MAX = 8;

export type CanvasThinkingItem = {
    title: string;
    content: string;
};

export function createThinkingResultTool(count: number) {
    return {
        name: "create_thinking_nodes",
        description: "返回结构清晰、彼此不同且可以直接继续用于内容生成的思维子节点。",
        parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
                items: {
                    type: "array",
                    minItems: count,
                    maxItems: count,
                    description: "按要求生成的思维子节点，数量必须与用户指定数量完全一致。",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            title: { type: "string", description: "简短、明确、不重复的中文节点标题。" },
                            content: { type: "string", description: "完整、自包含、可直接连接后续生成配置的中文内容。" },
                        },
                        required: ["title", "content"],
                    },
                },
            },
            required: ["items"],
        },
    };
}

export function normalizeThinkingCount(value?: number | string) {
    return Math.max(THINKING_COUNT_MIN, Math.min(THINKING_COUNT_MAX, Math.floor(Number(value) || 4)));
}

export function buildThinkingPrompt(task: string, mode: CanvasThinkingMode, count: number) {
    const structure =
        mode === "sequence"
            ? "连贯序列：所有节点共同组成一条前后承接的完整发展路径，后一个节点推进而不是重复前一个节点。"
            : mode === "outline"
              ? "总分展开：围绕总主题拆分互不重叠的方面，合在一起应完整覆盖主题。"
              : "自由发散：从明显不同的角度提出多种方案，避免同义改写和轻微变体。";
    return `你是画布中的 AI 思维规划器。请把用户目标拆成 ${count} 个文本子节点。

结构要求：${structure}

每个子节点必须：
1. 标题简短明确，彼此不同；
2. 内容具体、自包含，可以直接作为后续文本、生图或视频生成的提示输入；
3. 保留共同主题、人物、场景或风格约束，但只负责自己的独特内容；
4. 使用中文，不输出解释，只调用指定工具返回结果。

用户目标：
${task.trim()}`;
}

export function parseThinkingItems(value: unknown, expectedCount: number): CanvasThinkingItem[] {
    if (!isRecord(value) || !Array.isArray(value.items)) throw new Error("AI 没有返回有效的思维节点");
    const items = value.items.map((item) => {
        if (!isRecord(item)) throw new Error("AI 返回的思维节点格式无效");
        const title = typeof item.title === "string" ? item.title.trim() : "";
        const content = typeof item.content === "string" ? item.content.trim() : "";
        if (!title || !content) throw new Error("AI 返回了空的思维节点");
        return { title, content };
    });
    if (items.length !== expectedCount) throw new Error(`AI 应返回 ${expectedCount} 个思维节点，实际返回 ${items.length} 个`);
    if (new Set(items.map((item) => normalizeDistinctValue(item.title))).size !== items.length) throw new Error("AI 返回了重复的思维节点标题");
    if (new Set(items.map((item) => normalizeDistinctValue(item.content))).size !== items.length) throw new Error("AI 返回了重复的思维节点内容");
    return items;
}

export function createThinkingBranch(root: CanvasNodeData, items: CanvasThinkingItem[], mode: CanvasThinkingMode, runId = nanoid(), runIndex = 0) {
    const textSpec = NODE_DEFAULT_SIZE[CanvasNodeType.Text];
    const gap = 96;
    const rowGap = 36;
    const startX = root.position.x + root.width + gap + (mode === "sequence" ? 0 : runIndex * (textSpec.width + gap));
    const centerY = root.position.y + root.height / 2 - textSpec.height / 2 + (mode === "sequence" ? runIndex * (textSpec.height + 72) : 0);
    const nodes = items.map(
        (item, index): CanvasNodeData => ({
            id: nanoid(),
            type: CanvasNodeType.Text,
            title: mode === "sequence" ? `${String(index + 1).padStart(2, "0")} · ${item.title}` : item.title,
            position: mode === "sequence" ? { x: startX + index * (textSpec.width + 72), y: centerY } : { x: startX, y: centerY + (index - (items.length - 1) / 2) * (textSpec.height + rowGap) },
            width: textSpec.width,
            height: textSpec.height,
            metadata: {
                content: item.content,
                prompt: item.content,
                status: "success",
                fontSize: 14,
                thinkingRootId: root.id,
                thinkingRunId: runId,
                thinkingIndex: index,
            },
        }),
    );
    const connections: CanvasConnection[] = nodes.map((node, index) => ({
        id: nanoid(),
        fromNodeId: mode === "sequence" && index > 0 ? nodes[index - 1].id : root.id,
        toNodeId: node.id,
    }));
    return { nodes, connections, runId };
}

function normalizeDistinctValue(value: string) {
    return value.replace(/\s+/g, "").toLocaleLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
