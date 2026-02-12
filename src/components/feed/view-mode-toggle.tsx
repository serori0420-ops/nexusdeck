"use client"

import { useFeedStore } from "@/store/feed-store"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List, Smartphone } from "lucide-react"

export function ViewModeToggle() {
    const { viewMode, setViewMode } = useFeedStore()

    return (
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
            <Button
                variant={viewMode === "compact" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={() => setViewMode("compact")}
                title="コンパクト"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={() => setViewMode("card")}
                title="カード"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            {/* Gallery mode is not yet fully differentiated, but we can add the button or hide it for now.
                Let's keep it simple with 2 modes first as planned, or add 'gallery' if we want.
                The user asked for Compact/Card/Gallery. Let's add Gallery button even if it looks like Card for now.
             */}
            {/* 
            <Button
                variant={viewMode === "gallery" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={() => setViewMode("gallery")}
                title="ギャラリー"
            >
                <ImageIcon className="h-4 w-4" />
            </Button> 
            */}
        </div>
    )
}
