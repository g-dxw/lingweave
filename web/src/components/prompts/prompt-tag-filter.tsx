import { Search, Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Empty, Input, Popover, Tag } from "antd";

import { cn } from "@/lib/utils";
import { ALL_PROMPTS_OPTION, type PromptTagOption } from "@/services/api/prompts";

const HOT_TAG_LIMIT = 16;

export function PromptTagFilter({ options, selected, onChange }: { options: PromptTagOption[]; selected: string[]; onChange: (tags: string[]) => void }) {
    const [keyword, setKeyword] = useState("");
    const visibleOptions = useMemo(() => {
        const selectedOptions = selected.map((name) => options.find((option) => option.name === name) || { name, count: 0 });
        return Array.from(new Map([...selectedOptions, ...options.slice(0, HOT_TAG_LIMIT)].map((option) => [option.name, option])).values());
    }, [options, selected]);
    const searchedOptions = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        return normalizedKeyword ? options.filter((option) => option.name.toLowerCase().includes(normalizedKeyword)) : options;
    }, [keyword, options]);
    const toggleTag = (tag: string) => onChange(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Tag.CheckableTag checked={selected.length === 0} className={cn("prompt-filter-tag", selected.length === 0 && "is-active")} onChange={() => onChange([])}>
                {ALL_PROMPTS_OPTION}
            </Tag.CheckableTag>
            {visibleOptions.map((option) => (
                <Tag.CheckableTag key={option.name} checked={selected.includes(option.name)} className={cn("prompt-filter-tag", selected.includes(option.name) && "is-active")} onChange={() => toggleTag(option.name)}>
                    {option.name}<span className="ml-1 opacity-45">{option.count}</span>
                </Tag.CheckableTag>
            ))}
            {options.length > HOT_TAG_LIMIT ? (
                <Popover
                    trigger="click"
                    placement="bottomLeft"
                    content={
                        <div className="w-[320px]">
                            <Input allowClear prefix={<Search className="size-3.5 text-stone-400" />} placeholder="搜索全部标签" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
                            <div className="thin-scrollbar mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
                                {searchedOptions.map((option) => (
                                    <Tag.CheckableTag key={option.name} checked={selected.includes(option.name)} className={cn("prompt-filter-tag", selected.includes(option.name) && "is-active")} onChange={() => toggleTag(option.name)}>
                                        {option.name}<span className="ml-1 opacity-45">{option.count}</span>
                                    </Tag.CheckableTag>
                                ))}
                                {searchedOptions.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配标签" className="mx-auto py-5" /> : null}
                            </div>
                        </div>
                    }
                >
                    <Button type="text" size="small" icon={<Tags className="size-3.5" />}>更多标签</Button>
                </Popover>
            ) : null}
        </div>
    );
}
