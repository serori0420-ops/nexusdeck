"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Rss, X } from "lucide-react"
import { useFeedStore, PRESET_SOURCES, buildGoogleNewsRssUrl } from "@/store/feed-store"

interface SourceManagerProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function SourceManager({ open: controlledOpen, onOpenChange: setControlledOpen, trigger }: SourceManagerProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen ?? internalOpen
    const setOpen = setControlledOpen ?? setInternalOpen

    const { columns, addColumn, removeColumn, isInitialized, setInitialized, globalMuteKeywords, setGlobalMuteKeywords } = useFeedStore()

    // Form states
    const [keyword, setKeyword] = useState("")
    const [columnTitle, setColumnTitle] = useState("")
    const [rssUrl, setRssUrl] = useState("")
    const [rssTitle, setRssTitle] = useState("")
    const [muteInput, setMuteInput] = useState("")

    // Onboarding effect — only for instances without a trigger (auto-open)
    useEffect(() => {
        if (!trigger && !isInitialized && columns.length === 0) {
            setOpen(true)
        }
    }, [trigger, isInitialized, columns.length, setOpen])

    const handleAddByKeyword = () => {
        if (!keyword.trim()) return
        addColumn({
            title: columnTitle.trim() || keyword.trim(),
            url: buildGoogleNewsRssUrl(keyword.trim()),
            sourceName: "Google News",
        })
        setKeyword("")
        setColumnTitle("")
        setInitialized(true)
        setOpen(false)
    }

    const handleAddByUrl = () => {
        if (!rssUrl.trim()) return
        addColumn({
            title: rssTitle.trim() || "Custom Feed",
            url: rssUrl.trim(),
            sourceName: "RSS",
        })
        setRssUrl("")
        setRssTitle("")
        setInitialized(true)
        setOpen(false)
    }

    const handleAddMuteKeyword = () => {
        if (!muteInput.trim()) return
        const newKeyword = muteInput.trim()
        if (!globalMuteKeywords.includes(newKeyword)) {
            setGlobalMuteKeywords([...globalMuteKeywords, newKeyword])
        }
        setMuteInput("")
    }

    const handleRemoveMuteKeyword = (keywordToRemove: string) => {
        setGlobalMuteKeywords(globalMuteKeywords.filter(k => k !== keywordToRemove))
    }

    // Toggle preset directly (Immediate action)
    const togglePreset = (preset: typeof PRESET_SOURCES[0]) => {
        const existingColumn = columns.find(c => c.url === preset.url)

        if (existingColumn) {
            removeColumn(existingColumn.id)
        } else {
            addColumn({
                title: preset.title,
                url: preset.url,
                sourceName: preset.sourceName
            })
            // Mark as initialized when adding first column
            if (!isInitialized) setInitialized(true)
        }
    }

    // Group presets by category
    const groupedPresets = PRESET_SOURCES.reduce((acc, preset) => {
        if (!acc[preset.category]) {
            acc[preset.category] = []
        }
        acc[preset.category].push(preset)
        return acc
    }, {} as Record<string, typeof PRESET_SOURCES>)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
                <DialogHeader className="p-5 pb-2 border-b border-border/40 bg-muted/5 shrink-0">
                    <DialogTitle className="text-lg flex items-center gap-2">
                        <Rss className="h-5 w-5 text-primary" />
                        フィードを追加
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="presets" className="flex-1 flex flex-col min-h-0">
                    <div className="px-5 pt-3 shrink-0">
                        <TabsList className="grid w-full grid-cols-4 h-9 bg-muted/50">
                            <TabsTrigger value="presets" className="text-xs">
                                プリセット
                            </TabsTrigger>
                            <TabsTrigger value="keyword" className="text-xs">
                                キーワード
                            </TabsTrigger>
                            <TabsTrigger value="rss" className="text-xs">
                                カスタムRSS
                            </TabsTrigger>
                            <TabsTrigger value="mute" className="text-xs">
                                ミュート
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Presets Tab */}
                    <TabsContent value="presets" className="mt-0 outline-none data-[state=inactive]:hidden">
                        <ScrollArea className="h-[400px] px-5 py-4">
                            <div className="space-y-6">
                                {Object.entries(groupedPresets).map(([category, presets]) => (
                                    <div key={category}>
                                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">{category}</h4>
                                        <div className="grid gap-1">
                                            {presets.map((preset) => {
                                                const isAdded = columns.some(c => c.url === preset.url)
                                                return (
                                                    <label
                                                        key={preset.id}
                                                        className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer"
                                                    >
                                                        <div className="space-y-1 flex-1 min-w-0">
                                                            <span className="text-sm font-medium leading-none block">
                                                                {preset.title}
                                                            </span>
                                                            <p className="text-[11px] text-muted-foreground leading-snug">
                                                                {preset.description}
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={isAdded}
                                                            onCheckedChange={() => togglePreset(preset)}
                                                        />
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Keyword Tab */}
                    <TabsContent value="keyword" className="p-5 outline-none space-y-5 data-[state=inactive]:hidden">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="keyword">検索キーワード</Label>
                                <Input
                                    id="keyword"
                                    placeholder='例: "デジタル庁" OR "AI規制"'
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddByKeyword()}
                                />
                                <p className="text-[11px] text-muted-foreground">Googleニュースから指定したキーワードの最新情報を取得します</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="keyword-title">カラム名（任意）</Label>
                                <Input
                                    id="keyword-title"
                                    value={columnTitle}
                                    onChange={(e) => setColumnTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddByKeyword()}
                                />
                            </div>
                            <Button onClick={handleAddByKeyword} disabled={!keyword.trim()} className="w-full">
                                追加する
                            </Button>
                        </div>
                    </TabsContent>

                    {/* RSS Tab */}
                    <TabsContent value="rss" className="p-5 outline-none space-y-5 data-[state=inactive]:hidden">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rss-url">RSS / Atom フィードURL</Label>
                                <Input
                                    id="rss-url"
                                    placeholder="https://example.com/feed.xml"
                                    value={rssUrl}
                                    onChange={(e) => setRssUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddByUrl()}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rss-title">カラム名（任意）</Label>
                                <Input
                                    id="rss-title"
                                    value={rssTitle}
                                    onChange={(e) => setRssTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddByUrl()}
                                />
                            </div>
                            <Button onClick={handleAddByUrl} disabled={!rssUrl.trim()} className="w-full">
                                追加する
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Mute Tab */}
                    <TabsContent value="mute" className="p-5 outline-none space-y-5 data-[state=inactive]:hidden">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mute-keyword">ミュートするキーワード</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="mute-keyword"
                                        placeholder='例: "PR" や特定企業名'
                                        value={muteInput}
                                        onChange={(e) => setMuteInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddMuteKeyword()}
                                    />
                                    <Button onClick={handleAddMuteKeyword} disabled={!muteInput.trim()}>
                                        追加
                                    </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">追加したキーワードを含む記事（タイトル・要約）をすべてのカラムで非表示にします。</p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {globalMuteKeywords.length === 0 && (
                                    <p className="text-xs text-muted-foreground">ミュートキーワードは登録されていません</p>
                                )}
                                {globalMuteKeywords.map(keyword => (
                                    <Badge key={keyword} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                                        {keyword}
                                        <button
                                            onClick={() => handleRemoveMuteKeyword(keyword)}
                                            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                                            aria-label={`${keyword}のミュートを解除`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer - Close button only */}
                <div className="p-4 border-t border-border/40 bg-muted/5 shrink-0 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                        閉じる
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
