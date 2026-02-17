"use client"

import { useState, useEffect } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { FeedColumn } from "./feed-column"
import { SourceManager } from "./source-manager"
import { useFeedStore } from "@/store/feed-store"
import { Plus } from "lucide-react"

export function FeedContainer() {
    const columns = useFeedStore((s) => s.columns)
    const reorderColumns = useFeedStore((s) => s.reorderColumns)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    )

    const [isMounted, setIsMounted] = useState(false)

    const loadFromCloud = useFeedStore((s) => s.loadFromCloud)

    useEffect(() => {
        setIsMounted(true)
        loadFromCloud()
    }, [loadFromCloud])

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            reorderColumns(active.id as string, over.id as string)
        }
    }

    if (!isMounted) return null

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/40 hover:scrollbar-thumb-muted-foreground/40">
                    <SortableContext
                        items={columns.map((c) => c.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {columns.map((feed) => (
                            <FeedColumn
                                key={feed.id}
                                id={feed.id}
                                title={feed.title}
                                url={feed.url}
                                sourceName={feed.sourceName}
                            />
                        ))}
                    </SortableContext>

                    {/* Add Column Button */}
                    <SourceManager trigger={
                        <button className="flex flex-col items-center justify-center gap-3 w-[340px] min-w-[340px] h-full border-r border-border/30 text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/30 transition-all duration-200 cursor-pointer group">
                            <div className="h-12 w-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                <Plus className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium">カラムを追加</span>
                        </button>
                    } />

                    {/* End spacer */}
                    <div className="min-w-[60px] shrink-0" />
                </div>
            </DndContext>

            {/* Onboarding auto-open (no trigger, opens automatically on first visit) */}
            <SourceManager />
        </>
    )
}
