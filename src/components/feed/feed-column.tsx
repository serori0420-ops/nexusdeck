"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { FeedCard, Article } from "./feed-card"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, RefreshCw, X, GripVertical } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useFeedStore } from "@/store/feed-store"

interface FeedColumnProps {
    id: string
    title: string
    url: string
    sourceName: string
    className?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function FeedColumn({ id, title, url, sourceName, className }: FeedColumnProps) {
    // If URL starts with /api/, use it directly (e.g. GitHub Trending); otherwise proxy through /api/feed
    const apiUrl = url.startsWith('/api/')
        ? url
        : `/api/feed?url=${encodeURIComponent(url)}&source=${encodeURIComponent(sourceName)}`
    const { removeColumn, viewMode } = useFeedStore()

    const { data, error, isLoading, mutate } = useSWR<{ articles: Article[] }, any>(
        url ? apiUrl : null,
        fetcher,
        {
            refreshInterval: 300000,
            revalidateOnFocus: false,
        }
    )

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const rawArticles = data?.articles || []

    // Filter out PR / Ads
    const articles = rawArticles.filter(article => {
        const text = (article.title + (article.summary || "")).toLowerCase();
        const isAd =
            text.includes("[pr]") ||
            text.includes("【pr】") ||
            text.includes("sponsored") ||
            text.includes("partner content") ||
            text.startsWith("pr:") ||
            text.includes("広告");
        return !isAd;
    });

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex flex-col h-full w-[340px] min-w-[340px] snap-center bg-background border-r border-border/30 ${isDragging ? "opacity-50 z-50" : ""} ${className}`}
        >
            {/* Column Header */}
            <div className="px-3 py-2.5 flex items-center justify-between shrink-0 border-b border-border/40 group">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 -ml-1 rounded-md text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors"
                    aria-label="ドラッグして並び替え"
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-2 flex-1 ml-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h2 className="text-sm font-semibold tracking-tight truncate" title={title}>
                            {title}
                        </h2>
                    </div>
                    {!isLoading && !error && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
                            {articles.length}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => mutate()}
                        className="p-1 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-accent transition-all duration-200"
                        aria-label="更新"
                    >
                        <RefreshCw className="h-3 w-3" />
                    </button>
                    <button
                        onClick={() => removeColumn(id)}
                        className="p-1 rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                        aria-label="カラムを削除"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto w-full">
                <div className="flex flex-col gap-2 p-3">
                    {isLoading &&
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                    <Skeleton className="h-3 w-12 rounded" />
                                </div>
                                <Skeleton className="h-4 w-full rounded" />
                                <Skeleton className="h-4 w-3/4 rounded" />
                                <Skeleton className="h-3 w-5/6 rounded" />
                            </div>
                        ))}

                    {error && (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                            <AlertCircle className="h-6 w-6 text-destructive/50" />
                            <p className="text-xs">フィードの取得に失敗しました</p>
                            <button
                                onClick={() => mutate()}
                                className="text-xs text-primary hover:underline"
                            >
                                再試行
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && articles.length === 0 && (
                        <div className="flex items-center justify-center py-16">
                            <p className="text-xs text-muted-foreground">記事がありません</p>
                        </div>
                    )}

                    {articles.map((article) => (
                        <FeedCard key={article.id} article={article} viewMode={viewMode} />
                    ))}
                </div>
            </div>
        </div>
    )
}
