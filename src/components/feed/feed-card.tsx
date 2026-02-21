"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Bookmark, FileDown, Loader2 } from "lucide-react"
import dayjs from "dayjs"
import { useFeedStore } from "@/store/feed-store"

export interface Article {
    id: string
    title: string
    url: string
    source: string
    publishedAt: string
    summary?: string
    imageUrl?: string
}

interface FeedCardProps {
    article: Article;
    viewMode?: 'card' | 'compact' | 'gallery';
}

export function FeedCard({ article, viewMode = 'card' }: FeedCardProps) {
    const { addBookmark, removeBookmark, isBookmarked, readArticleIds, markAsRead } = useFeedStore()
    const bookmarked = isBookmarked(article.id)
    const isRead = readArticleIds.includes(article.id)

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (bookmarked) {
            removeBookmark(article.id)
        } else {
            addBookmark(article)
        }
    }

    // Markdownダウンロード/共有の状態管理
    const [isExtracting, setIsExtracting] = useState(false)

    const handleExtractMd = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isExtracting) return
        setIsExtracting(true)

        try {
            const res = await fetch(
                `/api/extract?url=${encodeURIComponent(article.url)}&title=${encodeURIComponent(article.title)}&date=${encodeURIComponent(article.publishedAt || '')}`
            )
            const data = await res.json()

            if (!res.ok || !data.markdown) {
                alert(data.error || '本文の抽出に失敗しました')
                return
            }

            // APIから返されるファイル名を使用（YYYY-MM-DD_タイトル.md）
            const fileName = data.suggestedFileName || `${article.title}.md`

            // モバイル判定：Web Share APIが使えるならシェアメニューを優先
            const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

            if (isMobile && navigator.share) {
                try {
                    await navigator.share({
                        title: data.title || article.title,
                        text: data.markdown,
                    })
                    return
                } catch (shareErr) {
                    // キャンセルされた場合はダウンロードにフォールバック
                    if ((shareErr as Error).name === 'AbortError') return
                }
            }

            // PC / フォールバック: Blobでダウンロード
            const blob = new Blob([data.markdown], { type: 'text/markdown;charset=utf-8' })
            const blobUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(blobUrl)
        } catch (err) {
            console.error('MD extraction failed:', err)
            alert('Markdownの生成に失敗しました。しばらくしてから再度お試しください。')
        } finally {
            setIsExtracting(false)
        }
    }

    // COMPACT MODE
    if (viewMode === 'compact') {
        return (
            <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markAsRead(article.id)}
                className="group flex items-start gap-3 rounded-lg border border-border/40 bg-card p-3 transition-colors hover:bg-accent/5 hover:border-primary/20"
            >
                {/* Optional small thumb for compact mode */}
                {article.imageUrl && (
                    <div className="shrink-0">
                        {(() => {
                            const isFavicon = article.imageUrl.includes('google.com/s2/favicons');
                            return (
                                <img
                                    src={article.imageUrl}
                                    alt=""
                                    className={`object-cover rounded-md bg-muted/20 ${isFavicon ? 'w-4 h-4 mt-0.5' : 'w-16 h-12'}`}
                                    loading="lazy"
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                            );
                        })()}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h3 className={`text-sm leading-snug transition-colors line-clamp-2 ${isRead ? 'text-muted-foreground/80 font-normal' : 'text-foreground font-medium group-hover:text-primary'}`}>
                        {article.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                            {dayjs(article.publishedAt).format("MM/DD HH:mm")}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            {article.source}
                        </span>
                    </div>
                </div>

                {/* Bookmark & MD Download buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        onClick={handleBookmark}
                        className={`p-1 rounded-md transition-colors ${bookmarked
                            ? 'text-primary'
                            : 'text-muted-foreground/40 hover:text-primary'
                            }`}
                        aria-label={bookmarked ? 'ブックマーク解除' : 'あとで読む'}
                    >
                        <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleExtractMd}
                        className="p-1 rounded-md text-muted-foreground/40 hover:text-primary transition-colors"
                        aria-label="Markdownで保存"
                        title="Markdownで保存"
                        disabled={isExtracting}
                    >
                        {isExtracting
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <FileDown className="h-3.5 w-3.5" />
                        }
                    </button>
                </div>
            </a>
        );
    }

    // CARD & GALLERY MODE (Standard)
    return (
        <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => markAsRead(article.id)}
            className="group block rounded-xl border border-border/50 bg-card p-0 overflow-hidden transition-all duration-200 ease-in-out hover:border-primary/30 hover:bg-accent/5 hover:shadow-sm"
        >
            {/* Image (Top) */}
            {article.imageUrl && (() => {
                const isFavicon = article.imageUrl.includes('google.com/s2/favicons');
                return isFavicon ? (
                    <div className="relative w-full h-16 overflow-hidden bg-gradient-to-r from-muted/30 to-muted/10 flex items-center justify-center gap-2 px-4">
                        <img
                            src={article.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded-md"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                        />
                        <span className="text-xs text-muted-foreground font-medium truncate">{article.source}</span>
                    </div>
                ) : (
                    <div className="relative w-full aspect-video overflow-hidden bg-muted/20">
                        <img
                            src={article.imageUrl}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                        />
                    </div>
                );
            })()}

            <div className="p-4">
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                        variant="secondary"
                        className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5"
                    >
                        {article.source}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                        {/* Bookmark button */}
                        <button
                            onClick={handleBookmark}
                            className={`p-1 rounded-md transition-all duration-200 ${bookmarked
                                ? 'text-primary'
                                : 'text-muted-foreground/40 hover:text-primary'
                                }`}
                            aria-label={bookmarked ? 'ブックマーク解除' : 'あとで読む'}
                        >
                            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                        </button>
                        {/* MD Download button */}
                        <button
                            onClick={handleExtractMd}
                            className="p-1 rounded-md text-muted-foreground/40 hover:text-primary transition-all duration-200"
                            aria-label="Markdownで保存"
                            title="Markdownで保存"
                            disabled={isExtracting}
                        >
                            {isExtracting
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <FileDown className="h-3.5 w-3.5" />
                            }
                        </button>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                            {dayjs(article.publishedAt).format("MM/DD HH:mm")}
                        </span>
                    </div>
                </div>

                {/* Title */}
                <h3 className={`text-sm leading-snug transition-colors duration-200 line-clamp-3 ${isRead ? 'text-muted-foreground/80 font-normal' : 'text-foreground font-medium group-hover:text-primary'}`}>
                    {article.title}
                </h3>

                {/* Summary */}
                {article.summary && (
                    <p className={`mt-2 text-xs leading-relaxed text-muted-foreground ${article.imageUrl ? 'line-clamp-2' : 'line-clamp-3'}`}>
                        {article.summary}
                    </p>
                )}

                {/* External link indicator */}
                <div className="mt-3 flex justify-end">
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors duration-200" />
                </div>
            </div>
        </a>
    )
}
