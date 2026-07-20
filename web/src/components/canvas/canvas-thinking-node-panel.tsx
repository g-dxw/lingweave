import { BrainCircuit, LoaderCircle, Play, Square } from "lucide-react";
import { Button, InputNumber, Segmented } from "antd";

import { ModelPicker } from "@/components/model-picker";
import { THINKING_COUNT_MAX, THINKING_COUNT_MIN, normalizeThinkingCount } from "@/lib/canvas/canvas-thinking";
import { canvasThemes } from "@/lib/canvas-theme";
import { defaultConfig, modelMatchesCapability, useConfigStore, useEffectiveConfig } from "@/stores/use-config-store";
import { useThemeStore } from "@/stores/use-theme-store";
import type { CanvasNodeData, CanvasNodeMetadata, CanvasThinkingMode } from "@/types/canvas";

type CanvasThinkingNodePanelProps = {
    node: CanvasNodeData;
    isRunning: boolean;
    inputSummary: { textCount: number; imageCount: number };
    onChange: (nodeId: string, patch: Partial<CanvasNodeMetadata>) => void;
    onGenerate: (nodeId: string) => void;
    onStop: (nodeId: string) => void;
};

const modeOptions = [
    { label: "发散", value: "diverge" },
    { label: "序列", value: "sequence" },
    { label: "总分", value: "outline" },
];

export function CanvasThinkingNodePanel({ node, isRunning, inputSummary, onChange, onGenerate, onStop }: CanvasThinkingNodePanelProps) {
    const globalConfig = useEffectiveConfig();
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const currentModel = node.metadata?.model;
    const model = currentModel && modelMatchesCapability(currentModel, "text") ? currentModel : globalConfig.textModel || defaultConfig.textModel;
    const config = { ...globalConfig, model };
    const prompt = node.metadata?.prompt || "";
    const count = normalizeThinkingCount(node.metadata?.thinkingCount);
    const hasInput = Boolean(prompt.trim() || inputSummary.textCount || inputSummary.imageCount);

    return (
        <div className="flex h-full w-full cursor-move flex-col gap-2 px-3 pb-3 pt-3 text-sm" style={{ color: theme.node.text }} onWheel={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl" style={{ background: theme.toolbar.activeBg, color: theme.node.muted }}>
                    <BrainCircuit className="size-4" />
                </span>
                <div className="min-w-0">
                    <div className="font-semibold leading-4">AI 思维</div>
                    <div className="mt-0.5 text-[11px]" style={{ color: theme.node.muted }}>
                        {inputSummary.textCount} 个文本 · {inputSummary.imageCount} 张图片
                    </div>
                </div>
            </div>

            <textarea
                value={prompt}
                aria-label="思考目标"
                placeholder="输入想要发散或拆解的主题…"
                className="thin-scrollbar min-h-16 flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-sm leading-5 outline-none"
                style={{ borderColor: theme.node.stroke, color: theme.node.text }}
                onMouseDown={(event) => event.stopPropagation()}
                onChange={(event) => onChange(node.id, { prompt: event.target.value })}
            />

            <div className="grid grid-cols-[minmax(0,1fr)_76px] gap-2" onMouseDown={(event) => event.stopPropagation()}>
                <Segmented
                    block
                    size="small"
                    className="canvas-config-mode !rounded-lg !p-0.5"
                    value={node.metadata?.thinkingMode || "diverge"}
                    options={modeOptions}
                    onChange={(value) => onChange(node.id, { thinkingMode: value as CanvasThinkingMode })}
                />
                <InputNumber className="!w-full" size="small" min={THINKING_COUNT_MIN} max={THINKING_COUNT_MAX} value={count} aria-label="子节点数量" onChange={(value) => onChange(node.id, { thinkingCount: normalizeThinkingCount(value || undefined) })} />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2" onMouseDown={(event) => event.stopPropagation()}>
                <ModelPicker className="canvas-compact-control h-9" config={config} value={model} onChange={(value) => onChange(node.id, { model: value })} capability="text" onMissingConfig={() => openConfigDialog(true)} fullWidth />
                <Button type="primary" danger={isRunning} className="!h-9 !rounded-lg !px-2" disabled={!isRunning && !hasInput} onClick={() => (isRunning ? onStop(node.id) : onGenerate(node.id))}>
                    {isRunning ? (
                        <span className="inline-flex items-center gap-1.5">
                            <LoaderCircle className="size-4 animate-spin" />
                            <Square className="size-3 fill-current" />
                            停止
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5">
                            <Play className="size-4" />
                            开始思考
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
