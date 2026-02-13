"use client"

import { useFeedStore } from "@/store/feed-store"
import { Button } from "@/components/ui/button"
import { Bookmark, X, ExternalLink } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import dayjs from "dayjs"

export function BookmarkPanel() {
    const { bookmarks, removeBookmark } = useFeedStore()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground relative shrink-0"
                >
                    <Bookmark className="h-5 w-5" />
                    {bookmarks.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {bookmarks.length > 99 ? '99+' : bookmarks.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[380px] sm:w-[420px] p-0 flex flex-col">
                <SheetHeader className="p-5 pb-3 border-b border-border/40 shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <Bookmark className="h-4 w-4" />
                        あとで読む
                        {bookmarks.length > 0 && (
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                {bookmarks.length}件
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    {bookmarks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-20">
                            <Bookmark className="h-8 w-8 opacity-30" />
                            <p className="text-sm">ブックマークはまだありません</p>
                            <p className="text-xs text-muted-foreground/60">
                                記事カードの
                                <Bookmark className="h-3 w-3 inline mx-1" />
                                をクリックして保存
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {bookmarks.map((article) => (
                                <div
                                    key={article.id}
                                    className="group flex gap-3 p-4 hover:bg-accent/5 transition-colors"
                                >
                                    {/* Thumbnail */}
                                    {article.imageUrl && !article.imageUrl.includes('google.com/s2/favicons') && (
                                        <div className="shrink-0">
                                            <img
                                                src={article.imageUrl}
                                                alt=""
                                                className="w-16 h-12 object-cover rounded-md bg-muted/20"
                                                loading="lazy"
                                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium leading-snug text-foreground hover:text-primary transition-colors line-clamp-2 block"
                                        >
                                            {article.title}
                                            <ExternalLink className="h-3 w-3 inline ml-1 opacity-40" />
                                        </a>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-muted-foreground">
                                                {article.source}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/40">•</span>
                                            <span className="text-[10px] text-muted-foreground tabular-nums">
                                                {dayjs(article.publishedAt).format("MM/DD HH:mm")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={() => removeBookmark(article.id)}
                                        className="shrink-0 p-1 rounded-md text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                                        aria-label="ブックマーク解除"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
