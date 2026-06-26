import { createBrowserRouter, Outlet } from "react-router-dom";

import NotFound from "@/app/not-found";
import UserLayout from "@/app/(user)/layout";
import IndexPage from "@/app/(user)/page";
import ImagePage from "@/app/(user)/image/page";
import VideoPage from "@/app/(user)/video/page";
import AssetsPage from "@/app/(user)/assets/page";
import PromptsPage from "@/app/(user)/prompts/page";
import CanvasPage from "@/app/(user)/canvas/page";
import CanvasProjectPage from "@/app/(user)/canvas/[id]/page";

export const router = createBrowserRouter([
    {
        element: (
            <UserLayout>
                <Outlet />
            </UserLayout>
        ),
        children: [
            { path: "/", element: <IndexPage /> },
            { path: "/image", element: <ImagePage /> },
            { path: "/video", element: <VideoPage /> },
            { path: "/assets", element: <AssetsPage /> },
            { path: "/prompts", element: <PromptsPage /> },
            { path: "/canvas", element: <CanvasPage /> },
            { path: "/canvas/:id", element: <CanvasProjectPage /> },
        ],
    },
    { path: "*", element: <NotFound /> },
]);
