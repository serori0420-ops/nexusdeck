"use client"

import { useEffect, useState } from "react"
import { useFeedStore } from "@/store/feed-store"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    BookOpen,
    LayoutDashboard,
    MonitorSmartphone,
    Newspaper,
    ChevronRight,
    Check,
} from "lucide-react"

interface TutorialStep {
    title: string
    description: string
    icon: React.ElementType
}

const STEPS: TutorialStep[] = [
    {
        title: "自分だけのニュースデッキ",
        description:
            "NexusDeckへようこそ。ここでは、テック・行政・最新トピックなど、あなたが興味のあるソースを自由に組み合わせて、最強の情報収集ツールを作ることができます。",
        icon: LayoutDashboard,
    },
    {
        title: "カラムを追加・整理",
        description:
            "ヘッダーの「＋マーク」から好きなソースを選んで追加したり、カラム全体をドラッグ＆ドロップして並び替えたりできます。不要なカラムはいつでも削除可能です。",
        icon: Newspaper,
    },
    {
        title: "ブックマークとビュー",
        description:
            "記事の「しおりアイコン」を押すと「あとで読む」に保存されます。また、右上のアイコンからカード表示・リスト表示を切り替えて、情報密度を調整できます。",
        icon: BookOpen,
    },
    {
        title: "クラウド同期",
        description:
            "あなたの設定はクラウドに自動保存されます。PCで設定したカラム構成やブックマークは、スマートフォンやタブレットからアクセスしてもそのまま利用できます。",
        icon: MonitorSmartphone,
    },
    {
        title: "準備完了！",
        description:
            "さあ、あなただけの情報ストリームを作りましょう。まずは気になるカラムを追加してみてください。",
        icon: Check,
    },
]

export function TutorialModal({ trigger }: { trigger?: React.ReactNode }) {
    const hasSeenTutorial = useFeedStore((s) => s.hasSeenTutorial)
    const setHasSeenTutorial = useFeedStore((s) => s.setHasSeenTutorial)
    const [open, setOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    // 初回アクセス時に自動表示
    useEffect(() => {
        if (!hasSeenTutorial) {
            // 少し遅延させて表示（マウント直後のちらつき防止）
            const timer = setTimeout(() => setOpen(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [hasSeenTutorial])

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleClose()
        }
    }

    const handleClose = () => {
        setHasSeenTutorial(true)
        setOpen(false)
        // リセット（次回開くときのために最初に戻しておく）
        setTimeout(() => setCurrentStep(0), 300)
    }

    const CurrentIcon = STEPS[currentStep].icon

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose()
            setOpen(val)
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CurrentIcon className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">
                        {STEPS[currentStep].title}
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2 text-muted-foreground/90">
                        {STEPS[currentStep].description}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicators */}
                <div className="flex justify-center gap-1.5 py-4">
                    {STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? "w-6 bg-primary" : "w-1.5 bg-primary/20"
                                }`}
                        />
                    ))}
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        className="w-full sm:w-auto min-w-[140px]"
                        onClick={handleNext}
                    >
                        {currentStep === STEPS.length - 1 ? (
                            "始める"
                        ) : (
                            <span className="flex items-center gap-2">
                                次へ <ChevronRight className="h-4 w-4" />
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
