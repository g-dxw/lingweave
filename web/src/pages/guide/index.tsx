import { ArrowRight, Check, CircleHelp, FileText, FolderPlus, ImagePlus, Link2, MousePointer2, Play, Settings2 } from "lucide-react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

const quickSteps = [
    { number: "01", title: "添加文本", description: "从底部工具栏添加一个文本节点，双击节点写下你想生成的画面。", icon: FileText },
    { number: "02", title: "点击生图", description: "点击文本节点右上角的“生图”，画布会自动创建并连接生成配置。", icon: ImagePlus },
    { number: "03", title: "开始生成", description: "选择模型、比例和数量，点击“开始生成”，结果会直接出现在画布上。", icon: Play },
] as const;

const afterGeneration = [
    { title: "继续引用", description: "从结果节点拖出连线，选择图片生成，把这一张作为下一次的参考图。", icon: Link2 },
    { title: "保存素材", description: "选中满意的结果，点击“存素材”，以后可以从“我的素材”重新放回画布。", icon: FolderPlus },
    { title: "修改分支", description: "保留原结果，只修改提示词或配置再生成；不同方向不会互相覆盖。", icon: MousePointer2 },
] as const;

const questions = [
    { question: "模型列表是空的？", answer: "先到“配置”登录 Niffler 并选择 API Key；未登录时也可以填写自己的 API Key，然后拉取模型。" },
    { question: "“开始生成”按钮不可用？", answer: "确认生成配置已经连接文本节点，或在“组装提示词”中直接输入内容。" },
    { question: "怎样让下一张保持一致？", answer: "不要只复制提示词，把上一张结果直接连到新的生成配置节点作为参考图。" },
    { question: "刷新后画布会丢吗？", answer: "画布项目默认保存在当前浏览器本地。需要换设备时，请导出画布或自行配置 WebDAV。" },
] as const;

export default function GuidePage() {
    const navigate = useNavigate();

    return (
        <main className="h-full overflow-y-auto bg-background text-stone-950 dark:text-stone-100">
            <section className="border-b border-stone-200 dark:border-stone-800">
                <div className="mx-auto grid min-h-[520px] max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[1fr_.78fr] lg:items-center lg:py-20">
                    <div>
                        <div className="mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-orange-700 dark:text-orange-400">
                            <span className="block h-px w-8 bg-current" />
                            快速上手
                        </div>
                        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl">第一次生成，只需要 3 步</h1>
                        <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500 dark:text-stone-400">不用先理解所有节点。打开一张空白画布，写下提示词，再选择模型开始生成；完成第一次之后，再学习参考图和分支。</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button type="primary" size="large" icon={<ArrowRight className="size-4" />} iconPlacement="end" onClick={() => navigate("/canvas?mode=new")}>开始第一次生成</Button>
                            <Button size="large" onClick={() => navigate("/config")}>检查模型配置</Button>
                        </div>
                    </div>

                    <div className="border-y border-stone-200 dark:border-stone-800">
                        {quickSteps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.number} className="grid grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-stone-200 py-5 last:border-b-0 dark:border-stone-800">
                                    <span className="font-mono text-xs text-stone-400">{step.number}</span>
                                    <div>
                                        <div className="text-sm font-semibold">{step.title}</div>
                                        <div className="mt-1 text-xs leading-5 text-stone-500">{step.description}</div>
                                    </div>
                                    <Icon className="size-5 text-stone-400" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
                <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
                    <div className="lg:sticky lg:top-20 lg:self-start">
                        <div className="text-sm font-medium text-stone-500">开始前</div>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">先确认模型可用</h2>
                        <p className="mt-5 text-sm leading-7 text-stone-500 dark:text-stone-400">登录 Niffler 后选择账号中的 API Key 和生图模型即可。你也可以不登录，直接使用自己的 API Key。</p>
                        <Button className="mt-6" icon={<Settings2 className="size-4" />} onClick={() => navigate("/config")}>打开配置</Button>
                    </div>

                    <div className="overflow-hidden border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-stone-50 px-5 py-4 dark:border-stone-800 dark:bg-stone-900">
                            <div>
                                <div className="text-sm font-semibold">准备完成的标志</div>
                                <div className="mt-1 text-xs text-stone-500">这三项都有值，就可以进入画布。</div>
                            </div>
                            <Check className="size-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="grid sm:grid-cols-3">
                            {["API Key 已选择", "生图模型已选择", "模型列表可正常显示"].map((item, index) => (
                                <div key={item} className="border-b border-stone-200 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 dark:border-stone-800">
                                    <div className="font-mono text-[11px] text-stone-400">0{index + 1}</div>
                                    <div className="mt-8 text-sm font-medium">{item}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950">
                <div className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
                    <div className="max-w-3xl">
                        <div className="text-sm font-medium text-stone-500">跟着操作</div>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">完成你的第一张图</h2>
                        <p className="mt-4 text-sm leading-7 text-stone-500 dark:text-stone-400">下面对应画布里的真实按钮名称，不需要手动创建连线。</p>
                    </div>

                    <div className="mt-10 grid gap-px overflow-hidden border border-stone-200 bg-stone-200 lg:grid-cols-3 dark:border-stone-800 dark:bg-stone-800">
                        <GuideStep number="01" title="写提示词" description="点击底部“文本”添加节点，双击节点输入内容。先把主体、场景和画面要求写清楚。">
                            <div className="rounded-xl border border-white/10 bg-stone-950 p-4 text-stone-100">
                                <div className="flex items-center justify-between text-xs text-stone-500"><span>文本</span><span>双击编辑</span></div>
                                <p className="mt-5 font-mono text-xs leading-6 text-stone-300">一只橙色机械狐狸，站在雨后的城市屋顶，电影感侧逆光，完整身体入镜。</p>
                            </div>
                        </GuideStep>

                        <GuideStep number="02" title="点击“生图”" description="文本节点右上角有“生图”按钮。点击后会自动生成配置节点，并把提示词连接过去。">
                            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-background dark:border-stone-700">
                                <Button type="primary" icon={<ImagePlus className="size-4" />}>生图</Button>
                            </div>
                        </GuideStep>

                        <GuideStep number="03" title="选择模型并生成" description="在生成配置里确认模型和图片设置，然后点击“开始生成”。结果会作为新节点保留。">
                            <div className="rounded-xl border border-stone-200 bg-background p-4 dark:border-stone-700">
                                <div className="text-sm font-semibold">生成配置</div>
                                <div className="mt-4 grid grid-cols-[1fr_84px] gap-2 text-xs text-stone-500">
                                    <div className="rounded-md border border-stone-200 px-3 py-2 dark:border-stone-700">生图模型</div>
                                    <div className="rounded-md border border-stone-200 px-3 py-2 dark:border-stone-700">1:1</div>
                                </div>
                                <div className="mt-3 flex h-9 items-center justify-center gap-2 rounded-lg bg-orange-600 text-xs font-medium text-white"><Play className="size-3.5" />开始生成</div>
                            </div>
                        </GuideStep>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
                <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
                    <div>
                        <div className="text-sm font-medium text-stone-500">生成以后</div>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">先学会这三件事</h2>
                        <p className="mt-5 text-sm leading-7 text-stone-500 dark:text-stone-400">第一次生成跑通以后，再开始组织连续工作流。无需一次掌握所有工具。</p>
                    </div>
                    <div className="grid border-l border-t border-stone-200 md:grid-cols-3 dark:border-stone-800">
                        {afterGeneration.map((item) => {
                            const Icon = item.icon;
                            return (
                                <article key={item.title} className="min-h-64 border-b border-r border-stone-200 p-6 dark:border-stone-800">
                                    <Icon className="size-5 text-stone-400" />
                                    <h3 className="mt-14 text-lg font-semibold">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-stone-500 dark:text-stone-400">{item.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="border-t border-stone-200 dark:border-stone-800">
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[.7fr_1.3fr] lg:py-20">
                    <div>
                        <CircleHelp className="size-6 text-orange-500" />
                        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">常见问题</h2>
                        <p className="mt-4 text-sm leading-7 text-stone-500 dark:text-stone-400">遇到问题时，先从模型、输入和本地保存范围排查。</p>
                    </div>
                    <div className="border-t border-stone-200 dark:border-stone-800">
                        {questions.map((item) => (
                            <div key={item.question} className="grid gap-2 border-b border-stone-200 py-5 sm:grid-cols-[180px_1fr] sm:gap-8 dark:border-stone-800">
                                <div className="text-sm font-medium">{item.question}</div>
                                <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-stone-950 text-white">
                <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 px-6 py-12 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-[-0.03em]">准备好了，就从一张空白画布开始</h2>
                        <p className="mt-2 text-sm text-stone-400">想先理解完整工作流，也可以打开预置案例自由拆解。</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3">
                        <Button size="large" onClick={() => navigate("/canvas?mode=example")}>打开案例</Button>
                        <Button type="primary" size="large" onClick={() => navigate("/canvas?mode=new")}>新建画布</Button>
                    </div>
                </div>
            </section>
        </main>
    );
}

function GuideStep({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
    return (
        <article className="flex min-h-[420px] flex-col bg-background p-6 sm:p-8">
            <div className="font-mono text-xs text-orange-600 dark:text-orange-400">STEP {number}</div>
            <h3 className="mt-8 text-xl font-semibold">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-stone-500 dark:text-stone-400">{description}</p>
            <div className="mt-auto pt-8">{children}</div>
        </article>
    );
}
