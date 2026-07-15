import { copyFile } from "node:fs/promises";

await copyFile(new URL("../out/api/search", import.meta.url), new URL("../out/docs-search", import.meta.url));
