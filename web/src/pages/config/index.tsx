import { AppConfigPanel } from "@/components/layout/app-config-modal";

export default function ConfigPage() {
    return (
        <main className="h-full overflow-y-auto bg-background">
            <div className="mx-auto max-w-6xl px-6 py-6">
                <div className="mb-5">
                    <h1 className="text-xl font-semibold text-stone-950 dark:text-stone-100">配置与用户偏好</h1>
                    <p className="mt-1 text-sm text-stone-500">登录后选择 Niffler Key 和模型；未登录时配置自己的 Base URL、API Key 并拉取模型</p>
                </div>
                <AppConfigPanel />
            </div>
        </main>
    );
}
