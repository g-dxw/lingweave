import { ArrowDown, ArrowRight, Bot, FileText, ImagePlus, Images, Maximize2, Sparkles, Video } from "lucide-react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

const exampleImageBase = `${import.meta.env.BASE_URL}examples/electric-moto`;
const scenes = [
    { number: "01", title: "产品主视觉", detail: "确定产品造型与视觉基准", image: `${exampleImageBase}/product.png` },
    { number: "02", title: "森林穿越", detail: "引用产品图，扩展人物与场景", image: `${exampleImageBase}/forest.png` },
    { number: "03", title: "城市穿行", detail: "同时引用产品和人物结果", image: `${exampleImageBase}/city.png` },
] as const;

const featureLinks = [
    { title: "提示词库", description: "从案例出发，不从空白开始", path: "/prompts", icon: FileText },
    { title: "我的素材", description: "沉淀产品图、结果和常用文本", path: "/assets", icon: Images },
    { title: "生图工作台", description: "快速验证单个视觉方向", path: "/image", icon: ImagePlus },
    { title: "视频创作台", description: "继续延展动态内容", path: "/video", icon: Video },
] as const;

const values = [
    { number: "01", title: "看见上下文", description: "提示词、参考图、模型配置和结果都在同一张画布上。" },
    { number: "02", title: "保持一致性", description: "把上一张好结果直接连接到下一次生成，而不是反复重述。" },
    { number: "03", title: "保留每一步", description: "分支、对比、回退和复用都有清晰来源，不让过程变成黑盒。" },
] as const;

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <main className="h-full overflow-y-auto bg-background text-stone-950 dark:text-stone-100">
            <section className="relative overflow-hidden border-b border-stone-200 dark:border-stone-800">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_13%_20%,rgba(249,115,22,.13),transparent_26%),radial-gradient(circle_at_82%_68%,rgba(59,130,246,.10),transparent_30%)]" />
                <div className="relative mx-auto grid min-h-[680px] max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:py-20">
                    <div>
                        <div className="mb-6 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-orange-700 dark:text-orange-400">
                            <span className="block h-px w-8 bg-current" />
                            AI VISUAL WORKSPACE
                        </div>
                        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-7xl">把一个创意，推进成一组连续内容</h1>
                        <p className="mt-7 max-w-xl text-base leading-8 text-stone-500 dark:text-stone-400">LingWeave 把提示词、参考素材、生成配置和结果连接起来。你看到的不只是最终图片，而是它如何产生、如何被继续引用。</p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Button type="primary" size="large" icon={<ArrowRight className="size-4" />} iconPlacement="end" onClick={() => navigate("/canvas?mode=new")}>新建画布</Button>
                            <Button size="large" onClick={() => navigate("/guide")}>快速上手</Button>
                            <Button size="large" onClick={() => navigate("/canvas?mode=example")}>打开案例</Button>
                        </div>
                        <div className="mt-12 grid max-w-xl grid-cols-3 border-l border-t border-stone-200 dark:border-stone-800">
                            {["节点编排", "连续参考", "本地沉淀"].map((item) => (
                                <div key={item} className="border-b border-r border-stone-200 px-3 py-4 text-center text-xs text-stone-500 dark:border-stone-800">{item}</div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] p-5 text-white [background-size:24px_24px] sm:p-7">
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                            <div>
                                <div className="text-sm font-semibold">案例｜电动越野摩托车全场景创作</div>
                                <div className="mt-1 text-xs text-stone-500">结果继续作为参考，逐步扩展场景</div>
                            </div>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-stone-400">可追踪工作流</span>
                        </div>
                        <div className="mt-6 space-y-3">
                            {scenes.map((scene, index) => (
                                <div key={scene.number}>
                                    <div className="grid grid-cols-[72px_minmax(0,1fr)_112px] items-center gap-4 rounded-xl border border-white/10 bg-stone-900/95 p-3 sm:grid-cols-[88px_minmax(0,1fr)_150px]">
                                        <div>
                                            <div className="font-mono text-[10px] text-orange-300">SCENE {scene.number}</div>
                                            <div className="mt-2 text-xs text-stone-500">提示词</div>
                                            <ArrowRight className="mt-2 size-3.5 text-stone-600" />
                                        </div>
                                        <div className="min-w-0 border-x border-white/10 px-4">
                                            <div className="text-sm font-medium">{scene.title}</div>
                                            <div className="mt-1 truncate text-xs text-stone-500">{scene.detail}</div>
                                            <div className="mt-3 flex gap-2 text-[10px] text-stone-500">
                                                <span className="rounded border border-white/10 px-2 py-1">生成配置</span>
                                                <span className="rounded border border-white/10 px-2 py-1">参考 {index}</span>
                                            </div>
                                        </div>
                                        <img src={scene.image} alt={`电动越野摩托车${scene.title}`} className="aspect-[3/2] w-full rounded-lg object-cover" />
                                    </div>
                                    {index < scenes.length - 1 ? <ArrowDown className="mx-auto my-1 size-3.5 text-stone-600" /> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
                <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
                    <div>
                        <div className="text-sm font-medium text-stone-500">为什么使用画布</div>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">生成只是动作，连续推进才是工作</h2>
                        <p className="mt-5 text-sm leading-7 text-stone-500 dark:text-stone-400">单次表单适合得到一张图；当产品、人物和场景需要持续保持一致时，需要一张能承载关系和过程的工作区。</p>
                        <Button type="link" className="mt-6 p-0" onClick={() => navigate("/guide")}>了解完整使用方法 <ArrowRight className="ml-1 size-3.5" /></Button>
                    </div>
                    <div className="grid border-l border-t border-stone-200 md:grid-cols-3 dark:border-stone-800">
                        {values.map((item) => (
                            <article key={item.number} className="min-h-64 border-b border-r border-stone-200 p-6 dark:border-stone-800">
                                <div className="font-mono text-xs text-stone-400">{item.number}</div>
                                <h3 className="mt-14 text-lg font-semibold">{item.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-stone-500 dark:text-stone-400">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-stone-200 dark:border-stone-800">
                <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.05fr_.95fr]">
                    <article className="border-b border-stone-200 p-8 sm:p-10 lg:border-b-0 lg:border-r dark:border-stone-800">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-full bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950"><Maximize2 className="size-4" /></span>
                            <div>
                                <div className="text-xs text-stone-400">核心工作区</div>
                                <h2 className="mt-1 text-xl font-semibold">无限画布</h2>
                            </div>
                        </div>
                        <p className="mt-8 max-w-xl text-sm leading-7 text-stone-500 dark:text-stone-400">上传素材、编写需求、连接配置、生成图片/文本/视频/音频，再把满意结果连接到下一条分支。所有内容保留在本地画布项目中。</p>
                        <Button className="mt-7" type="primary" onClick={() => navigate("/canvas")}>进入我的画布</Button>
                    </article>
                    <div className="grid grid-cols-2">
                        {featureLinks.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <button key={feature.path} type="button" className="group border-b border-r border-stone-200 p-6 text-left transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900" onClick={() => navigate(feature.path)}>
                                    <Icon className="size-5 text-stone-400 transition group-hover:text-orange-500" />
                                    <div className="mt-8 text-sm font-semibold">{feature.title}</div>
                                    <div className="mt-2 text-xs leading-5 text-stone-500">{feature.description}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:py-20">
                <div className="flex items-start gap-4">
                    <Bot className="mt-1 size-5 text-orange-500" />
                    <div>
                        <h2 className="text-2xl font-semibold tracking-[-0.03em]">既可以手动创作，也可以让 Codex 帮你操作画布</h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500 dark:text-stone-400">连接本地 Canvas Agent 后，Codex 可以读取节点、整理关系、创建生成流程；它是协作增强，不会取代画布本身。</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button size="large" icon={<Sparkles className="size-4" />} onClick={() => navigate("/guide")}>快速上手</Button>
                    <Button size="large" onClick={() => navigate("/config")}>配置与连接</Button>
                </div>
            </section>
        </main>
    );
}
