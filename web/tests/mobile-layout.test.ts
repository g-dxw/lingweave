import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), "src", path), "utf8");

describe("移动端布局约束", () => {
    it("顶部导航和 Agent 面板在窄屏保持主要操作可达", () => {
        expect(source("components/layout/app-top-nav.tsx")).toContain('className="hidden md:block"');
        expect(source("components/agent/agent-panel.tsx")).toContain("max-md:!w-dvw");
        expect(source("components/agent/agent-panel.tsx")).toContain("max-md:hidden");
    });

    it("画布顶部和工具栏不再使用固定桌面宽度占满窄屏", () => {
        expect(source("pages/canvas/project.tsx")).toContain("max-w-[96px]");
        expect(source("components/canvas/canvas-toolbar.tsx")).toContain("bottom-24 left-4 right-4");
        expect(source("components/canvas/canvas-toolbar.tsx")).toContain("md:left-[300px]");
    });

    it("表单和项目列表允许移动端换行与收缩", () => {
        expect(source("components/layout/app-config-modal.tsx")).toContain("flex flex-col items-stretch");
        expect(source("components/canvas/canvas-project-card.tsx")).toContain("min-h-44 min-w-0");
        expect(source("pages/image/index.tsx")).toContain("max-[379px]:w-full");
        expect(source("pages/image/index.tsx")).toContain("grid min-w-0 gap-3");
        expect(source("pages/video/index.tsx")).toContain("max-[379px]:w-full");
        expect(source("pages/video/index.tsx")).toContain("grid min-w-0 gap-3");
    });

    it("首页案例卡片在移动端将详情放到独立行", () => {
        expect(source("pages/home/index.tsx")).toContain("grid-cols-[minmax(0,1fr)_112px]");
        expect(source("pages/home/index.tsx")).toContain("col-span-2 min-w-0 border-t");
        expect(source("pages/home/index.tsx")).toContain("col-start-2 row-start-1");
    });
});
