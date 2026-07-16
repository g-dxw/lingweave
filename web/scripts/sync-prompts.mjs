import { createHash } from "node:crypto";
import { access, copyFile, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(webDir, "public", "prompt-library");
const tempDir = `${outputDir}.tmp`;
const imageDir = join(tempDir, "images");
const force = process.argv.includes("--force");
const concurrency = positiveInteger(process.env.PROMPT_SYNC_CONCURRENCY, 12);

const sources = {
    awesomeGptImage: {
        category: "awesome-gpt-image",
        label: "ZeroLu / awesome-gpt-image",
        githubUrl: "https://github.com/ZeroLu/awesome-gpt-image",
        rawBase: "https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main",
    },
    awesomeGpt4oImagePrompts: {
        category: "awesome-gpt4o-image-prompts",
        label: "ImgEdify / Awesome-GPT4o-Image-Prompts",
        githubUrl: "https://github.com/ImgEdify/Awesome-GPT4o-Image-Prompts",
        rawBase: "https://raw.githubusercontent.com/ImgEdify/Awesome-GPT4o-Image-Prompts/main",
    },
    youMindGptImage2: {
        category: "youmind-gpt-image-2",
        label: "YouMind / awesome-gpt-image-2",
        githubUrl: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
        rawBase: "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main",
    },
    youMindNanoBananaPro: {
        category: "youmind-nano-banana-pro",
        label: "YouMind / awesome-nano-banana-pro-prompts",
        githubUrl: "https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts",
        rawBase: "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts/main",
    },
    davidWuGptImage2: {
        category: "davidwu-gpt-image2-prompts",
        label: "DavidWu / awesome-gpt-image2-prompts",
        githubUrl: "https://github.com/davidwuw0811-boop/awesome-gpt-image2-prompts",
        rawBase: "https://raw.githubusercontent.com/davidwuw0811-boop/awesome-gpt-image2-prompts/main",
    },
};

const tagAliases = new Map([
    ["ui", "UI设计"],
    ["ui与界面", "UI设计"],
    ["poster", "海报"],
    ["海报设计", "海报"],
    ["portrait", "人物肖像"],
    ["个人资料", "人物肖像"],
    ["头像", "人物肖像"],
    ["illustration", "插画"],
    ["anime", "动漫插画"],
    ["anime_illustration", "动漫插画"],
    ["infographic", "信息图"],
    ["信息图设计", "信息图"],
    ["product", "产品展示"],
    ["product_poster", "产品海报"],
    ["3d_cute", "3D"],
    ["other", "其他"],
    ["creative", "创意设计"],
    ["food", "美食摄影"],
    ["illustration_map", "插画地图"],
    ["game_scifi", "游戏科幻"],
    ["anime_adaptation", "动漫改编"],
    ["social_dance", "社交舞蹈"],
    ["wuxia_history", "武侠历史"],
    ["dance_action", "舞蹈动作"],
    ["vfx_fantasy", "奇幻特效"],
]);

await rm(tempDir, { recursive: true, force: true });
await mkdir(imageDir, { recursive: true });

console.log("正在读取上游提示词...");
const groups = await Promise.all([
    buildAwesomeGptImagePrompts(sources.awesomeGptImage),
    buildAwesomeGpt4oImagePrompts(sources.awesomeGpt4oImagePrompts),
    buildYouMindPrompts(sources.youMindGptImage2, "youmind-gpt-image-2", "gpt-image-2"),
    buildYouMindPrompts(sources.youMindNanoBananaPro, "youmind-nano-banana-pro", "nano-banana-pro"),
    buildDavidWuGptImage2Prompts(sources.davidWuGptImage2),
]);
const items = groups.flat();
const images = new Map(items.filter((item) => item.sourceImageUrl).map((item) => [item.sourceImageUrl, imageFileName(item.sourceImageUrl)]));
const availableImages = new Set();
const failedImages = [];

console.log(`共 ${items.length} 条提示词，开始同步 ${images.size} 张封面...`);
let completed = 0;
await runPool([...images], concurrency, async ([url, fileName]) => {
    const target = join(imageDir, fileName);
    const existing = join(outputDir, "images", fileName);
    try {
        if (!force && (await exists(existing))) {
            await copyFile(existing, target);
        } else {
            await downloadCover(url, target);
        }
        availableImages.add(url);
    } catch (error) {
        failedImages.push({ url, message: error instanceof Error ? error.message : String(error) });
    }
    completed += 1;
    if (completed % 25 === 0 || completed === images.size) console.log(`已同步 ${completed}/${images.size}`);
});

if (failedImages.length) {
    console.warn(`有 ${failedImages.length} 张封面同步失败，已使用无封面占位。`);
    for (const { url, message } of failedImages.slice(0, 10)) console.warn(`- ${url}: ${message.split("\n").at(-1)}`);
    if (failedImages.length > 10) console.warn(`- 其余 ${failedImages.length - 10} 张失败封面已省略`);
}

const library = {
    syncedAt: new Date().toISOString(),
    sources: Object.values(sources).map(({ category, label, githubUrl }) => ({ id: category, label, githubUrl })),
    items: items.map(({ sourceImageUrl, ...item }) => ({
        ...item,
        coverUrl: sourceImageUrl && availableImages.has(sourceImageUrl) ? `images/${images.get(sourceImageUrl)}` : "",
    })),
};
await writeFile(join(tempDir, "index.json"), `${JSON.stringify(library)}\n`);
await rm(outputDir, { recursive: true, force: true });
await rename(tempDir, outputDir);
console.log(`同步完成：${outputDir}`);

async function buildAwesomeGptImagePrompts(source) {
    const markdown = await fetchText(source.rawBase, "README.zh-CN.md");
    const items = [];
    for (const section of splitBeforeHeading(markdown, "## ")) {
        const tags = tagsFromHeading(firstMatch(section, /^##\s+(.+)$/m));
        for (const block of splitBeforeHeading(section, "### ")) {
            const title = firstMatch(block, /^###\s+(.+)$/m)
                .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
                .trim();
            const prompt = firstMatch(block, /\*\*提示词:\*\*\s*\r?\n\s*```[\w-]*\r?\n(.*?)\r?\n```/s).trim();
            if (!title || !prompt) continue;
            items.push(createPrompt(source, `awesome-gpt-image-${leftPad(items.length + 1)}`, title, prompt, tags, pickCover(source.rawBase, block)));
        }
    }
    return items;
}

async function buildAwesomeGpt4oImagePrompts(source) {
    const markdown = await fetchText(source.rawBase, "README.zh-CN.md");
    const items = [];
    for (const block of splitBeforeHeading(markdown, "### ")) {
        const title = firstMatch(block, /^###\s+(.+)$/m).trim();
        const prompt = firstMatch(block, /- \*\*提示词文本：\*\*\s*`(.*?)`/s).trim();
        if (!title || !prompt) continue;
        items.push(createPrompt(source, `awesome-gpt4o-image-prompts-${leftPad(items.length + 1)}`, title, prompt, ["gpt4o"], pickCover(source.rawBase, block)));
    }
    return items;
}

async function buildYouMindPrompts(source, idPrefix, modelTag) {
    const markdown = await fetchText(source.rawBase, "README_zh.md");
    const items = [];
    for (const block of splitBeforeHeading(markdown, "### ")) {
        const title = firstMatch(block, /^###\s+No\.\s*\d+:\s*(.+)$/m).trim();
        const prompt = firstMatch(block, /#### .*?提示词\s*\r?\n\s*```[\w-]*\r?\n(.*?)\r?\n```/s).trim();
        if (!title || !prompt) continue;
        items.push(createPrompt(source, `${idPrefix}-${leftPad(items.length + 1)}`, title, prompt, youMindTags(title, modelTag), pickCover(source.rawBase, block)));
    }
    return items;
}

async function buildDavidWuGptImage2Prompts(source) {
    const data = JSON.parse(await fetchText(source.rawBase, "prompts.json"));
    return data
        .map((item, index) => {
            const title = (item.title_cn || item.title_en || "").trim();
            const prompt = (item.prompt || "").trim();
            if (!title || !prompt) return null;
            return createPrompt(source, `davidwu-gpt-image2-prompts-${leftPad(item.id || index + 1)}`, title, prompt, davidWuTags(item), absoluteImage(source.rawBase, item.image || ""));
        })
        .filter(Boolean);
}

function createPrompt(source, id, title, prompt, tags, sourceImageUrl) {
    const normalizedTags = normalizePromptTags(tags);
    const category = promptCategory(title, normalizedTags);
    return { id, title, coverUrl: "", prompt, tags: normalizedTags.filter((tag) => tag !== category).slice(0, 5), category, source: source.label, githubUrl: source.githubUrl, preview: "", createdAt: "", updatedAt: "", sourceImageUrl };
}

function pickCover(baseUrl, markdown) {
    return extractImages(baseUrl, markdown).find((url) => !isDecorationImage(url)) || "";
}

function extractImages(baseUrl, value) {
    const markdownImages = Array.from(value.matchAll(/!\[[^\]]*]\(([^)]+)\)/g), (match) => match[1]);
    const htmlImages = Array.from(value.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi), (match) => match[1]);
    return [...markdownImages, ...htmlImages].map((image) => absoluteImage(baseUrl, image.replaceAll("&amp;", "&"))).filter(Boolean);
}

function isDecorationImage(value) {
    return /(?:awesome\.re\/badge|img\.shields\.io|api\.star-history\.com|actions\/workflows\/.+\/badge|atomgit\.com\/.+\/badge)/i.test(value);
}

function absoluteImage(baseUrl, image) {
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;
    return `${baseUrl}/${image.replace(/^\.?\//, "")}`;
}

async function fetchText(baseUrl, file) {
    const response = await fetchWithRetry(`${baseUrl}/${file}`);
    return response.text();
}

async function downloadCover(url, target) {
    const response = await fetchWithRetry(url, { attempts: 1, timeoutMs: 10_000 });
    const input = Buffer.from(await response.arrayBuffer());
    const output = await sharp(input).rotate().resize(640, 480, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toBuffer();
    await writeFile(target, output);
}

async function fetchWithRetry(url, { attempts = 3, timeoutMs = 60_000 } = {}) {
    let error;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url, { headers: { "user-agent": "infinite-canvas-prompt-sync" }, signal: AbortSignal.timeout(timeoutMs) });
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            return response;
        } catch (nextError) {
            error = nextError;
            if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 800));
        }
    }
    throw new Error(`下载失败：${url}\n${error instanceof Error ? error.message : String(error)}`);
}

function positiveInteger(value, fallback) {
    const parsed = Number.parseInt(value || "", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function runPool(values, size, task) {
    let cursor = 0;
    await Promise.all(
        Array.from({ length: size }, async () => {
            while (cursor < values.length) {
                const current = values[cursor];
                cursor += 1;
                await task(current);
            }
        }),
    );
}

function imageFileName(url) {
    return `${createHash("sha256").update(url).digest("hex").slice(0, 20)}.webp`;
}

async function exists(file) {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
}

function splitBeforeHeading(markdown, prefix) {
    const blocks = [];
    let current = [];
    for (const line of markdown.split("\n")) {
        if (line.startsWith(prefix) && current.length) {
            blocks.push(current.join("\n"));
            current = [];
        }
        current.push(line);
    }
    blocks.push(current.join("\n"));
    return blocks;
}

function firstMatch(value, pattern) {
    return pattern.exec(value)?.[1] || "";
}

function tagsFromHeading(heading) {
    return splitTags(heading.replace(/[^\p{L}\p{N}/&、与 ]/gu, ""), /\s*(?:\/|&|、|与)\s*/);
}

function youMindTags(title, modelTag) {
    const [, prefix] = title.match(/^(.+?) - /) || [];
    return [modelTag, ...tagsFromHeading(prefix || "")];
}

function davidWuTags(item) {
    const tags = splitTags([item.category_cn, item.category].filter(Boolean).join("/"), /\//);
    if (item.needs_ref) tags.push("需要参考图");
    return tags;
}

function normalizePromptTags(tags) {
    const normalized = [];
    for (const rawTag of tags) {
        const value = rawTag
            .trim()
            .toLowerCase()
            .replace(/^(?:图像|视频)模板\s*-\s*/, "");
        if (!value || value.startsWith("@") || /(?:gpt|nano.?banana|awesome|awsome)/i.test(value)) continue;
        const alias = tagAliases.get(value);
        if (!alias && /^[a-z0-9_. -]+(?:\(sora\))?$/i.test(value)) continue;
        normalized.push(alias || rawTag.trim().replace(/^(?:图像|视频)模板\s*-\s*/, ""));
    }
    return Array.from(new Set(normalized));
}

function promptCategory(title, tags) {
    const value = [title, ...tags].join(" ").toLowerCase();
    const rules = [
        ["信息图", /(信息图|infographic|图表|教育视觉)/],
        ["UI设计", /(^|\s)ui(\s|$)|ui设计|界面|网页设计|网站设计|app设计/],
        ["图像编辑", /(图像编辑|风格迁移|修复|替换|一致性|局部修改|照片编辑)/],
        ["人物头像", /(人物肖像|头像|人像|portrait|profile|证件照)/],
        ["社交媒体", /(社交媒体|小红书|instagram|youtube|缩略图|社交帖子)/],
        ["影视分镜", /(故事板|分镜|漫画|电影感|影视|动漫改编|游戏科幻|武侠历史|舞蹈动作|奇幻特效)/],
        ["产品电商", /(产品|电商|商品|包装|美食摄影|product)/],
        ["品牌营销", /(品牌|营销|广告|logo|标志设计)/],
        ["海报设计", /(海报|poster|封面|banner)/],
        ["插画艺术", /(插画|动漫|艺术|3d|手办|潮玩|illustration)/],
    ];
    return rules.find(([, pattern]) => pattern.test(value))?.[0] || "其他";
}

function splitTags(value, pattern) {
    return value
        .split(pattern)
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
}

function leftPad(value) {
    return String(value).padStart(4, "0");
}
