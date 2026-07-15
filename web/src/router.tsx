import { createBrowserRouter, Outlet } from "react-router-dom";

import UserLayout from "@/layouts/user-layout";

export const router = createBrowserRouter(
    [
        {
            HydrateFallback: () => null,
            element: (
                <UserLayout>
                    <Outlet />
                </UserLayout>
            ),
            children: [
                { path: "/", lazy: async () => ({ Component: (await import("@/pages/home")).default }) },
                { path: "/image", lazy: async () => ({ Component: (await import("@/pages/image")).default }) },
                { path: "/video", lazy: async () => ({ Component: (await import("@/pages/video")).default }) },
                { path: "/assets", lazy: async () => ({ Component: (await import("@/pages/assets")).default }) },
                { path: "/prompts", lazy: async () => ({ Component: (await import("@/pages/prompts")).default }) },
                { path: "/canvas", lazy: async () => ({ Component: (await import("@/pages/canvas")).default }) },
                { path: "/canvas/:id", lazy: async () => ({ Component: (await import("@/pages/canvas/project")).default }) },
                { path: "/config", lazy: async () => ({ Component: (await import("@/pages/config")).default }) },
                { path: "/guide", lazy: async () => ({ Component: (await import("@/pages/guide")).default }) },
            ],
        },
        { path: "*", lazy: async () => ({ Component: (await import("@/pages/not-found")).default }) },
    ],
    { basename: import.meta.env.BASE_URL },
);
