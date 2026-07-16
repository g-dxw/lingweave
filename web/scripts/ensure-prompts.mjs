import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const webDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(webDir, "public");
const outputDir = join(publicDir, "prompt-library");
const tempDir = `${outputDir}.download`;
const archivePath = `${tempDir}.tar.gz`;

if (await isReady(outputDir)) {
    console.log("提示词库已就绪");
} else {
    try {
        await downloadRelease();
    } catch (error) {
        console.warn(`发布资源不可用，将从上游同步：${error instanceof Error ? error.message : String(error)}`);
        await rm(tempDir, { recursive: true, force: true });
        await rm(archivePath, { force: true });
        await import("./sync-prompts.mjs");
    }
}

async function downloadRelease() {
    const version = (await readFile(resolve(webDir, "../VERSION"), "utf8")).trim();
    const url = process.env.PROMPT_LIBRARY_URL || `https://github.com/g-dxw/lingweave/releases/download/${version}/prompt-library.tar.gz`;
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(120_000) });
    if (!response.ok || !response.body) throw new Error(`${response.status} ${response.statusText}`);

    await rm(tempDir, { recursive: true, force: true });
    await rm(archivePath, { force: true });
    await mkdir(tempDir, { recursive: true });
    await pipeline(response.body, createWriteStream(archivePath));
    await execFileAsync("tar", ["-xzf", archivePath, "-C", tempDir]);

    const extractedDir = join(tempDir, "prompt-library");
    if (!(await isReady(extractedDir))) throw new Error("资源包内容不完整");
    await rm(outputDir, { recursive: true, force: true });
    await rename(extractedDir, outputDir);
    await rm(tempDir, { recursive: true, force: true });
    await rm(archivePath, { force: true });
    console.log(`已下载 ${version} 提示词库`);
}

async function isReady(directory) {
    try {
        await access(join(directory, "index.json"));
        return (await readdir(join(directory, "images"))).length > 0;
    } catch {
        return false;
    }
}
