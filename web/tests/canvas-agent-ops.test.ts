import { describe, expect, it } from "vitest";

import { runnableCanvasAgentGenerationOps, type CanvasAgentOp } from "@/lib/canvas/canvas-agent-ops";

describe("画布 Agent 生成操作", () => {
    it("忽略运行中的节点以及同一批次内的重复触发", () => {
        const ops: CanvasAgentOp[] = [
            { type: "run_generation", nodeId: "running-config", mode: "image" },
            { type: "run_generation", nodeId: "idle-config", mode: "image" },
            { type: "run_generation", nodeId: "idle-config", mode: "image" },
            { type: "select_nodes", ids: ["idle-config"] },
        ];

        expect(runnableCanvasAgentGenerationOps(ops, ["running-config"])).toEqual([{ type: "run_generation", nodeId: "idle-config", mode: "image" }]);
    });
});
