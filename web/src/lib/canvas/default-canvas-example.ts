import { localForageStorage } from "@/lib/localforage-storage";
import { setImageBlob } from "@/services/image-storage";
import { useCanvasStore, type CanvasProject } from "@/stores/canvas/use-canvas-store";
import { CanvasNodeType } from "@/types/canvas";

const INSTALLED_KEY = "infinite-canvas:default-example:electric-moto:v1";
export const DEFAULT_CANVAS_EXAMPLE_TITLE = "案例｜电动越野摩托车全场景创作";

const PRODUCT_PROMPT = "高端电商产品主视觉，一辆未来感电动越野摩托车作为唯一主体，三分之四侧前视角，完整车身入镜。哑光石墨黑与金属深灰车身，少量电光橙点缀，轻量化铝合金车架，可见紧凑电池舱与电驱结构，长行程倒立前叉，后单筒避震，粗壮深纹越野轮胎，高离地间隙，极简锋利车灯。产品静置于深灰色影棚地面，柔和体积光和轮廓光勾勒结构，细微地面反射与少量尘土颗粒，背景简洁留白，真实工业设计，超精细材质，专业汽车广告摄影，写实，清晰锐利，居中构图。不要骑手，不要人物，不要文字，不要品牌标志，不要水印，不要多辆车，不要裁切车轮，不要畸形零件。";
const FOREST_PROMPT = "严格参考所连接图片中的同一辆电动越野摩托车，保持车架造型、哑光石墨黑和金属深灰配色、电光橙点缀、车灯、悬挂、电池舱与轮胎结构一致。场景改为清晨的茂密针叶树林，一名穿纯黑无标识专业越野护具和全盔的骑手驾驶这辆车高速穿越狭窄泥土林道，车辆三分之四侧前视角，前轮微微抬起越过树根，粗纹轮胎卷起湿润泥土、落叶和薄雾，车身仍是画面绝对主体。阳光从树冠间形成金色光束，背景树木有真实速度感与轻微运动模糊，主体车辆清晰锐利，悬挂正在工作，画面充满力量与速度。高端户外品牌广告摄影，电影级构图，自然写实，精细材质，真实物理动态。不要改变车型，不要增加或删除车轮，不要畸形结构，不要文字，不要品牌标志，不要水印，不要多辆车。";
const CITY_PROMPT = "同时严格参考两张连接图片：保持产品图中电动越野摩托车的完整造型、哑光石墨黑与金属深灰车身、电光橙点缀、车架、电池舱、悬挂、车灯和粗纹轮胎完全一致；保持森林骑行图中同一名骑手的体型、纯黑无标识越野护具、全盔与骑姿一致。场景改为蓝调时刻的现代城市中心，骑手驾驶这辆电动越野摩托车高速穿行在宽阔街道，低机位三分之四侧前跟拍，车辆和骑手清晰锐利并占据画面主体。雨后柏油路面有细腻反光，高楼玻璃幕墙、街灯和少量霓虹形成纵深，背景建筑与路灯呈电影感运动模糊，车轮带起轻微水雾，前灯点亮，突出安静强劲的电驱速度感。高端城市出行广告摄影，电影级光影，真实自然，精细材质，动态构图。不要改变车型，不要改变人物装备，不要增加乘客，不要畸形肢体，不要多辆摩托车，不要文字，不要品牌标志，不要水印。";

const images = [
    { id: "example-moto-product", file: "product.png", storageKey: "image:example-electric-moto-product", bytes: 2077901 },
    { id: "example-moto-forest", file: "forest.png", storageKey: "image:example-electric-moto-forest", bytes: 2584030 },
    { id: "example-moto-city", file: "city.png", storageKey: "image:example-electric-moto-city", bytes: 2422381 },
] as const;

export async function installDefaultCanvasExample(force = false) {
    const projects = useCanvasStore.getState().projects;
    const installedId = await localForageStorage.getItem(INSTALLED_KEY);
    const installed = projects.find((project) => project.id === installedId) || projects.find((project) => project.title === DEFAULT_CANVAS_EXAMPLE_TITLE);
    if (installed) {
        await localForageStorage.setItem(INSTALLED_KEY, installed.id);
        return installed.id;
    }
    if (installedId && !force) return null;

    await Promise.all(
        images.map(async (image) => {
            const response = await fetch(`${import.meta.env.BASE_URL}examples/electric-moto/${image.file}`);
            if (!response.ok) throw new Error(`加载默认案例图片失败：${image.file}`);
            await setImageBlob(image.storageKey, await response.blob());
        }),
    );
    const projectId = useCanvasStore.getState().importProject(defaultProject());
    await localForageStorage.setItem(INSTALLED_KEY, projectId);
    return projectId;
}

function defaultProject(): Partial<CanvasProject> {
    const product = images[0];
    const forest = images[1];
    const city = images[2];
    const imageMetadata = (image: (typeof images)[number], prompt: string, references: string[] = []) => ({
        content: `${import.meta.env.BASE_URL}examples/electric-moto/${image.file}`,
        storageKey: image.storageKey,
        prompt,
        status: "success" as const,
        generationType: references.length ? ("edit" as const) : ("generation" as const),
        model: "gpt-image-2",
        size: references.length ? "16:9" : "1:1",
        quality: "high",
        count: 1,
        references,
        naturalWidth: 1536,
        naturalHeight: 1024,
        bytes: image.bytes,
        mimeType: "image/png",
        primaryImageId: image.id,
        isBatchRoot: false,
        batchUsesReferenceImages: references.length > 0,
    });

    return {
        title: DEFAULT_CANVAS_EXAMPLE_TITLE,
        backgroundMode: "lines",
        showImageInfo: false,
        chatSessions: [],
        activeChatId: null,
        viewport: { x: 55, y: 70, k: 0.6 },
        nodes: [
            { id: "example-prompt-product", type: CanvasNodeType.Text, title: "电动越野摩托车｜产品主视觉", position: { x: 120, y: 100 }, width: 340, height: 240, metadata: { content: PRODUCT_PROMPT, status: "success", fontSize: 14 } },
            { id: "example-config-product", type: CanvasNodeType.Config, title: "电动越野摩托车｜产品主视觉", position: { x: 540, y: 100 }, width: 340, height: 240, metadata: { content: "", status: "success", generationMode: "image", composerContent: "@[node:example-prompt-product]", prompt: PRODUCT_PROMPT, size: "1:1", quality: "high", count: 1 } },
            { id: product.id, type: CanvasNodeType.Image, title: "电动越野摩托车｜产品主视觉", position: { x: 976, y: 107 }, width: 340, height: 227, metadata: imageMetadata(product, PRODUCT_PROMPT) },
            { id: "example-prompt-forest", type: CanvasNodeType.Text, title: "电动越野摩托车｜森林穿越", position: { x: 120, y: 460 }, width: 340, height: 240, metadata: { content: FOREST_PROMPT, status: "success", fontSize: 14 } },
            { id: "example-config-forest", type: CanvasNodeType.Config, title: "电动越野摩托车｜森林穿越", position: { x: 540, y: 460 }, width: 340, height: 240, metadata: { content: "", status: "success", generationMode: "image", composerContent: "@[node:example-prompt-forest]\n@[node:example-moto-product]", prompt: FOREST_PROMPT, size: "16:9", quality: "high", count: 1 } },
            { id: forest.id, type: CanvasNodeType.Image, title: "电动越野摩托车｜森林穿越", position: { x: 976, y: 467 }, width: 340, height: 227, metadata: imageMetadata(forest, FOREST_PROMPT, [product.storageKey]) },
            { id: "example-prompt-city", type: CanvasNodeType.Text, title: "电动越野摩托车｜城市穿行", position: { x: 120, y: 820 }, width: 340, height: 240, metadata: { content: CITY_PROMPT, status: "success", fontSize: 14 } },
            { id: "example-config-city", type: CanvasNodeType.Config, title: "电动越野摩托车｜城市穿行", position: { x: 540, y: 820 }, width: 340, height: 240, metadata: { content: "", status: "success", generationMode: "image", composerContent: "@[node:example-prompt-city]\n@[node:example-moto-product]\n@[node:example-moto-forest]", prompt: CITY_PROMPT, size: "16:9", quality: "high", count: 1 } },
            { id: city.id, type: CanvasNodeType.Image, title: "电动越野摩托车｜城市穿行", position: { x: 976, y: 827 }, width: 340, height: 227, metadata: imageMetadata(city, CITY_PROMPT, [product.storageKey, forest.storageKey]) },
        ],
        connections: [
            { id: "example-link-product-prompt", fromNodeId: "example-prompt-product", toNodeId: "example-config-product" },
            { id: "example-link-product-output", fromNodeId: "example-config-product", toNodeId: product.id },
            { id: "example-link-forest-prompt", fromNodeId: "example-prompt-forest", toNodeId: "example-config-forest" },
            { id: "example-link-forest-reference", fromNodeId: product.id, toNodeId: "example-config-forest" },
            { id: "example-link-forest-output", fromNodeId: "example-config-forest", toNodeId: forest.id },
            { id: "example-link-city-prompt", fromNodeId: "example-prompt-city", toNodeId: "example-config-city" },
            { id: "example-link-city-product", fromNodeId: product.id, toNodeId: "example-config-city" },
            { id: "example-link-city-rider", fromNodeId: forest.id, toNodeId: "example-config-city" },
            { id: "example-link-city-output", fromNodeId: "example-config-city", toNodeId: city.id },
        ],
    };
}
