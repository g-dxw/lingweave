import { access, cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsOutDir = resolve(webDir, "../docs/out");
const publicDir = resolve(webDir, "public");
const mappings = [
    ["docs", "docs"],
    ["_next", "_next"],
    ["docs-search", "docs-search"],
    ["llms.mdx", "llms.mdx"],
    ["github.svg", "github.svg"],
    ["qq.svg", "qq.svg"],
];

await access(docsOutDir).catch(() => {
    throw new Error("没有找到 docs/out，请先在 docs/ 目录执行文档构建");
});

await rm(resolve(publicDir, "api/search"), { recursive: true, force: true });

for (const [sourcePath, targetPath] of mappings) {
    const source = resolve(docsOutDir, sourcePath);
    const target = resolve(publicDir, targetPath);
    await rm(target, { recursive: true, force: true });
    try {
        await access(source);
    } catch {
        continue;
    }
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
}

console.log("本地文档已映射到 web/public/docs");
