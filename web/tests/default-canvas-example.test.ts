import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const storage = new Map<string, string>();
    const canvasState = {
        projects: [] as Array<{ id: string; title: string }>,
        importProject: vi.fn<(_project: unknown) => string>(),
    };
    return { storage, canvasState, setImageBlob: vi.fn<(_key: string, _blob: Blob) => Promise<void>>() };
});

vi.mock("@/lib/localforage-storage", () => ({
    localForageStorage: {
        getItem: vi.fn(async (key: string) => mocks.storage.get(key) || null),
        setItem: vi.fn(async (key: string, value: string) => void mocks.storage.set(key, value)),
    },
}));

vi.mock("@/services/image-storage", () => ({ setImageBlob: mocks.setImageBlob }));
vi.mock("@/stores/canvas/use-canvas-store", () => ({ useCanvasStore: { getState: () => mocks.canvasState } }));

import { DEFAULT_CANVAS_EXAMPLE_TITLE, installDefaultCanvasExample } from "@/lib/canvas/default-canvas-example";

const installedKey = "infinite-canvas:default-example:electric-moto:v1";

beforeEach(() => {
    mocks.storage.clear();
    mocks.canvasState.projects = [];
    mocks.canvasState.importProject.mockReset().mockReturnValue("example-project");
    mocks.setImageBlob.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Blob(["image"]), { status: 200 })));
});

afterEach(() => vi.unstubAllGlobals());

describe("默认画布案例", () => {
    it("首次使用时下载图片并记录项目 ID", async () => {
        const projectId = await installDefaultCanvasExample();

        expect(projectId).toBe("example-project");
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(mocks.setImageBlob).toHaveBeenCalledTimes(3);
        expect(mocks.canvasState.importProject).toHaveBeenCalledOnce();
        expect(mocks.storage.get(installedKey)).toBe("example-project");
        const project = mocks.canvasState.importProject.mock.calls[0][0] as { title: string; nodes: unknown[]; connections: unknown[] };
        expect(project.title).toBe(DEFAULT_CANVAS_EXAMPLE_TITLE);
        expect(project.nodes).toHaveLength(9);
        expect(project.connections).toHaveLength(9);
    });

    it("案例仍存在时不会重复安装", async () => {
        mocks.storage.set(installedKey, "existing-project");
        mocks.canvasState.projects = [{ id: "existing-project", title: "用户重命名后的案例" }];

        await expect(installDefaultCanvasExample()).resolves.toBe("existing-project");
        expect(fetch).not.toHaveBeenCalled();
        expect(mocks.canvasState.importProject).not.toHaveBeenCalled();
    });

    it("删除案例后普通进入画布不会自动恢复", async () => {
        mocks.storage.set(installedKey, "deleted-project");

        await expect(installDefaultCanvasExample()).resolves.toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("删除案例后从案例入口可以重新安装", async () => {
        mocks.storage.set(installedKey, "deleted-project");

        await expect(installDefaultCanvasExample(true)).resolves.toBe("example-project");
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(mocks.storage.get(installedKey)).toBe("example-project");
    });
});
