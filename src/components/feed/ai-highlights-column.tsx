"use client"

import { useFeedStore } from "@/store/feed-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FeedCard } from "./feed-card"
import { Sparkles } from "lucide-react"

/**
 * AI Highlights カラム — Scout Agent が収集した記事を専用カラムで表示する。
 * 通常のRSSカラムと同じ幅（340px）で、カラム列の先頭に固定配置される。
 * ブックマークのうち id が "ai-" で始まるもの = Scout Agent 経由の記事。
 */
export function AiHighlightsColumn() {
    const { bookmarks, viewMode, removeBookmark } = useFeedStore()

    // Scout Agent が追加したブックマークのみを抽出（MCPサーバで "ai-" prefix を付与）
    const scoutArticles = bookmarks.filter(b => b.id.startsWith("ai-"))

    // Scout記事が0件の場合はカラム自体を表示しない
    if (scoutArticles.length === 0) return null

    return (
        <div className="flex flex-col h-full w-[340px] min-w-[340px] snap-center bg-background border-r border-border/30">
            {/* ヘッダー: AI Highlights の専用デザイン */}
            <div className="px-3 py-2.5 flex items-center justify-between shrink-0 border-b border-border/40">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <h2 className="text-sm font-semibold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            AI Highlights
                        </h2>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
                        {scoutArticles.length}
                    </span>
                </div>
            </div>

            {/* 記事リスト */}
            <div
                className="flex-1 min-h-0 overflow-y-auto w-full overscroll-y-contain"
                style={{ touchAction: "pan-x pan-y" }}
            >
                <div className="flex flex-col gap-2 p-3">
                    {scoutArticles.map((article) => (
                        <div key={article.id} className="relative">
                            {/* Scout Agent の要約をカード上部に表示 */}
                            {article.summary && (
                                <div className="mb-1.5 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                    <p className="text-[11px] leading-relaxed text-amber-200/80">
                                        <Sparkles className="h-3 w-3 inline mr-1 text-amber-400/60" />
                                        {article.summary}
                                    </p>
                                </div>
                            )}
                            <FeedCard article={article} viewMode={viewMode} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
