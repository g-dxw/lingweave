import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

import { nanoid } from "nanoid";
import { localForageStorage } from "@/lib/localforage-storage";
import type { CanvasBackgroundMode } from "@/lib/canvas-theme";
import type { CanvasAssistantSession, CanvasConnection, CanvasNodeData, ViewportTransform } from "@/types/canvas";

export type CanvasProject = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    chatSessions: CanvasAssistantSession[];
    activeChatId: string | null;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
    viewport: ViewportTransform;
};

type CanvasStore = {
    hydrated: boolean;
    projects: CanvasProject[];
    createProject: (title?: string) => string;
    importProject: (project: Partial<CanvasProject>) => string;
    openProject: (id: string) => CanvasProject | null;
    renameProject: (id: string, title: string) => void;
    deleteProjects: (ids: string[]) => void;
    replaceProjects: (projects: CanvasProject[]) => void;
    updateProject: (id: string, patch: Partial<Pick<CanvasProject, "nodes" | "connections" | "chatSessions" | "activeChatId" | "backgroundMode" | "showImageInfo" | "viewport">>) => void;
};

const initialViewport: ViewportTransform = { x: 0, y: 0, k: 1 };
const CANVAS_STORE_KEY = "infinite-canvas:canvas_store";
type PersistedCanvasState = Pick<CanvasStore, "projects">;
type CanvasProjectIndex = { ids: string[]; version?: number };
let persistedProjects = new Map<string, CanvasProject>();
let queuedStorageValue: StorageValue<CanvasStore> | null = null;
let storageWriteRunning = false;

const projectStorageKey = (name: string, id: string) => `${name}:project:${id}`;

async function flushCanvasStorage(name: string) {
    if (storageWriteRunning) return;
    storageWriteRunning = true;
    try {
        while (queuedStorageValue) {
            const value = queuedStorageValue;
            queuedStorageValue = null;
            const projects = (value.state as PersistedCanvasState).projects;
            const nextProjects = new Map(projects.map((project) => [project.id, project]));
            const writes = projects.filter((project) => persistedProjects.get(project.id) !== project).map((project) => localForageStorage.setItem(projectStorageKey(name, project.id), JSON.stringify(project)));
            const removals = [...persistedProjects.keys()].filter((id) => !nextProjects.has(id)).map((id) => localForageStorage.removeItem(projectStorageKey(name, id)));
            await Promise.all([...writes, ...removals]);
            await localForageStorage.setItem(name, JSON.stringify({ ids: projects.map((project) => project.id), version: value.version } satisfies CanvasProjectIndex));
            persistedProjects = nextProjects;
        }
    } finally {
        storageWriteRunning = false;
        if (queuedStorageValue) void flushCanvasStorage(name);
    }
}

const canvasStorage: PersistStorage<CanvasStore> = {
    getItem: async (name) => {
        const value = await localForageStorage.getItem(name);
        if (!value) return null;
        const index = JSON.parse(value) as CanvasProjectIndex;
        const storedProjects = await Promise.all(index.ids.map((id) => localForageStorage.getItem(projectStorageKey(name, id))));
        const projects = storedProjects.flatMap((project) => (project ? [JSON.parse(project) as CanvasProject] : []));
        persistedProjects = new Map(projects.map((project) => [project.id, project]));
        return { state: { projects } as CanvasStore, version: index.version };
    },
    setItem: (name, value) => {
        queuedStorageValue = value;
        void flushCanvasStorage(name);
    },
    removeItem: async (name) => {
        queuedStorageValue = null;
        await Promise.all([...persistedProjects.keys()].map((id) => localForageStorage.removeItem(projectStorageKey(name, id))));
        persistedProjects.clear();
        await localForageStorage.removeItem(name);
    },
};

export const useCanvasStore = create<CanvasStore>()(
    persist(
        (set, get) => ({
            hydrated: false,
            projects: [],
            createProject: (title = "未命名画布") => {
                const now = new Date().toISOString();
                const id = nanoid();
                const project: CanvasProject = {
                    id,
                    title,
                    createdAt: now,
                    updatedAt: now,
                    nodes: [],
                    connections: [],
                    chatSessions: [],
                    activeChatId: null,
                    backgroundMode: "lines",
                    showImageInfo: false,
                    viewport: initialViewport,
                };
                set((state) => ({ projects: [project, ...state.projects] }));
                return id;
            },
            importProject: (source) => {
                const now = new Date().toISOString();
                const project: CanvasProject = {
                    id: nanoid(),
                    title: source.title || "导入画布",
                    createdAt: source.createdAt || now,
                    updatedAt: now,
                    nodes: source.nodes || [],
                    connections: source.connections || [],
                    chatSessions: source.chatSessions || [],
                    activeChatId: source.activeChatId || null,
                    backgroundMode: source.backgroundMode || "lines",
                    showImageInfo: source.showImageInfo || false,
                    viewport: source.viewport || initialViewport,
                };
                set((state) => ({ projects: [project, ...state.projects] }));
                return project.id;
            },
            openProject: (id) => {
                return get().projects.find((item) => item.id === id) || null;
            },
            renameProject: (id, title) =>
                set((state) => ({
                    projects: state.projects.map((project) => (project.id === id ? { ...project, title: title.trim() || project.title, updatedAt: new Date().toISOString() } : project)),
                })),
            deleteProjects: (ids) =>
                set((state) => {
                    const projects = state.projects.filter((project) => !ids.includes(project.id));
                    return { projects };
                }),
            replaceProjects: (projects) => set({ projects }),
            updateProject: (id, patch) =>
                set((state) => ({
                    projects: state.projects.map((project) => (project.id === id ? { ...project, ...patch, updatedAt: new Date().toISOString() } : project)),
                })),
        }),
        {
            name: CANVAS_STORE_KEY,
            storage: canvasStorage,
            partialize: (state) =>
                ({
                    projects: state.projects,
                }) as StorageValue<CanvasStore>["state"],
            onRehydrateStorage: () => () => {
                useCanvasStore.setState({ hydrated: true });
            },
        },
    ),
);
