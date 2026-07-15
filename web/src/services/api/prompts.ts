export type Prompt = {
    id: string;
    title: string;
    coverUrl: string;
    prompt: string;
    tags: string[];
    category: string;
    source: string;
    githubUrl: string;
    preview: string;
    createdAt: string;
    updatedAt: string;
};

export type PromptTagOption = {
    name: string;
    count: number;
};

export const ALL_PROMPTS_OPTION = "全部";

export type PromptListResponse = {
    items: Prompt[];
    tags: PromptTagOption[];
    categories: string[];
    total: number;
};

type PromptLibrary = {
    items: Prompt[];
};

const libraryBaseUrl = `${import.meta.env.BASE_URL}prompt-library`;
const categoryOrder = ["人物头像", "产品电商", "海报设计", "品牌营销", "插画艺术", "信息图", "影视分镜", "社交媒体", "UI设计", "图像编辑", "其他"];
let promptItems: Prompt[] | null = null;
let loadingPrompts: Promise<Prompt[]> | null = null;

export async function fetchPrompts({ keyword = "", tag = [], category = ALL_PROMPTS_OPTION, page = 1, pageSize = 20 }: { keyword?: string; tag?: string[]; category?: string; page?: number; pageSize?: number } = {}) {
    const items = await getPrompts();
    const normalizedKeyword = keyword.trim().toLowerCase();
    const normalizedPage = Math.max(1, page);
    const normalizedPageSize = Math.max(1, Math.min(100, pageSize));
    const withoutTagFilter = filterPrompts(items, { keyword: normalizedKeyword, category, tags: [] });
    const filtered = filterPrompts(items, { keyword: normalizedKeyword, category, tags: tag });

    return {
        items: filtered.slice((normalizedPage - 1) * normalizedPageSize, normalizedPage * normalizedPageSize),
        tags: collectTags(withoutTagFilter),
        categories: categoryOrder.filter((category) => items.some((item) => item.category === category)),
        total: filtered.length,
    };
}

async function getPrompts() {
    if (promptItems) return promptItems;
    if (loadingPrompts) return loadingPrompts;
    loadingPrompts = fetch(`${libraryBaseUrl}/index.json`, { cache: "no-cache" })
        .then(async (response) => {
            if (!response.ok) throw new Error("本地提示词库不存在，请先执行 npm run sync:prompts");
            const library = (await response.json()) as PromptLibrary;
            promptItems = library.items.map((item) => ({ ...item, coverUrl: item.coverUrl ? `${libraryBaseUrl}/${item.coverUrl}` : "" }));
            return promptItems;
        })
        .finally(() => {
            loadingPrompts = null;
        });
    return loadingPrompts;
}

function filterPrompts(items: Prompt[], options: { keyword: string; category: string; tags: string[] }) {
    return items.filter((item) => {
        if (isActiveOption(options.category) && item.category !== options.category) return false;
        if (options.tags.length && !options.tags.some((tag) => item.tags.includes(tag))) return false;
        if (!options.keyword) return true;
        return [item.title, item.prompt, item.category, item.source, ...item.tags].join(" ").toLowerCase().includes(options.keyword);
    });
}

function collectTags(items: Prompt[]) {
    const counts = new Map<string, number>();
    for (const item of items) {
        for (const tag of item.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

function isActiveOption(value: string) {
    return value && value !== "全部" && value !== "all";
}

export function formatPromptDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
