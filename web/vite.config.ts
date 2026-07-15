import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

import { parseChangelog } from "./src/lib/release";

const webDir = dirname(fileURLToPath(import.meta.url));
const localDocsDir = resolve(webDir, "public/docs");
const localVersion = readFileSync(resolve(webDir, "../VERSION"), "utf8").trim() || "dev";
const localChangelog = readFileSync(resolve(webDir, "../CHANGELOG.md"), "utf8");

function localDocsRoutes(): Plugin {
    const serveDocsRoute = async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
        if ((request.method !== "GET" && request.method !== "HEAD") || !request.url) return next();
        const url = new URL(request.url, "http://localhost");
        if (!url.pathname.startsWith("/docs") || url.pathname.split("/").pop()?.includes(".")) return next();
        const relativePath = decodeURIComponent(url.pathname.slice("/docs".length)).replace(/^\/+|\/+$/g, "");
        const filePath = resolve(localDocsDir, relativePath, "index.html");
        if (!filePath.startsWith(localDocsDir)) return next();
        try {
            const content = await readFile(filePath);
            response.statusCode = 200;
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(request.method === "HEAD" ? undefined : content);
        } catch {
            next();
        }
    };
    return {
        name: "local-docs-routes",
        configureServer(server) {
            server.middlewares.use(serveDocsRoute);
        },
        configurePreviewServer(server) {
            server.middlewares.use(serveDocsRoute);
        },
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, webDir, "");
    const nifflerProxyTarget = (process.env.NIFFLER_PROXY_TARGET || env.NIFFLER_PROXY_TARGET || "https://niffler.org").trim().replace(/\/+$/, "");

    return {
        base: process.env.VITE_BASE || "/",
        plugins: [localDocsRoutes(), react()],
        server: {
            proxy: {
                "/api": {
                    target: nifflerProxyTarget,
                    changeOrigin: true,
                    cookieDomainRewrite: "",
                },
                "/v1": {
                    target: nifflerProxyTarget,
                    changeOrigin: true,
                },
            },
        },
        resolve: {
            alias: {
                "@": resolve(webDir, "src"),
            },
        },
        define: {
            __APP_VERSION__: JSON.stringify(localVersion),
            __APP_RELEASES__: JSON.stringify(parseChangelog(localChangelog)),
        },
    };
});
