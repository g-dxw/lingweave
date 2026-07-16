/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_NIFFLER_ORIGIN?: string;
}

declare const __APP_VERSION__: string;
declare const __APP_RELEASES__: import("@/lib/release").ReleaseInfo[];
