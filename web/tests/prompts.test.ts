import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const items = [
    { id: "1", title: "电影人物", coverUrl: "images/portrait.webp", prompt: "cinematic portrait", tags: ["人物", "电影"], category: "人物头像", source: "OpenAI Collection", githubUrl: "https://example.com/1", preview: "", createdAt: "", updatedAt: "" },
    { id: "2", title: "产品海报", coverUrl: "", prompt: "orange product poster", tags: ["产品", "海报"], category: "产品电商", source: "Poster Collection", githubUrl: "https://example.com/2", preview: "", createdAt: "", updatedAt: "" },
    { id: "3", title: "品牌人物", coverUrl: "images/brand.webp", prompt: "brand portrait", tags: ["人物", "品牌"], category: "品牌营销", source: "Brand Collection", githubUrl: "https://example.com/3", preview: "", createdAt: "", updatedAt: "" },
];

beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items }), { status: 200, headers: { "Content-Type": "application/json" } })));
});

afterEach(() => vi.unstubAllGlobals());

describe("提示词库", () => {
    it("加载本地快照并补全封面路径", async () => {
        const { fetchPrompts } = await import("@/services/api/prompts");
        const result = await fetchPrompts();

        expect(fetch).toHaveBeenCalledWith("/prompt-library/index.json", { cache: "no-cache" });
        expect(result.items[0].coverUrl).toBe("/prompt-library/images/portrait.webp");
        expect(result.total).toBe(3);
    });

    it("支持按标题、提示词和来源搜索", async () => {
        const { fetchPrompts } = await import("@/services/api/prompts");

        await expect(fetchPrompts({ keyword: "openai" })).resolves.toMatchObject({ total: 1, items: [{ id: "1" }] });
        await expect(fetchPrompts({ keyword: "orange" })).resolves.toMatchObject({ total: 1, items: [{ id: "2" }] });
    });

    it("组合分类与标签筛选并返回标签计数", async () => {
        const { fetchPrompts } = await import("@/services/api/prompts");
        const result = await fetchPrompts({ tag: ["人物", "产品"] });

        expect(result.items.map((item) => item.id)).toEqual(["1", "2", "3"]);
        expect(result.tags.find((tag) => tag.name === "人物")?.count).toBe(2);
        expect(result.categories).toEqual(["人物头像", "产品电商", "品牌营销"]);
    });

    it("分页返回稳定的总数", async () => {
        const { fetchPrompts } = await import("@/services/api/prompts");
        const result = await fetchPrompts({ page: 2, pageSize: 2 });

        expect(result.total).toBe(3);
        expect(result.items.map((item) => item.id)).toEqual(["3"]);
    });

    it("本地快照缺失时返回明确错误", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("missing", { status: 404 })));
        const { fetchPrompts } = await import("@/services/api/prompts");

        await expect(fetchPrompts()).rejects.toThrow("本地提示词库不存在");
    });
});
