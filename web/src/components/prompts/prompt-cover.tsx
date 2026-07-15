import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function PromptCover({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [failed, setFailed] = useState(!src);

    useEffect(() => setFailed(!src), [src]);

    if (failed) {
        return (
            <div className={cn("flex items-center justify-center bg-stone-100 text-stone-400 dark:bg-stone-900 dark:text-stone-600", className)}>
                <ImageOff className="size-8" />
            </div>
        );
    }

    return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
