"use client"

import { useState } from "react"
import { Mail, Send, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useFeedStore } from "@/store/feed-store"

const HOUR_OPTIONS = [
    { label: '6:00', value: 6 },
    { label: '7:00', value: 7 },
    { label: '8:00', value: 8 },
    { label: '9:00', value: 9 },
]

export function DigestSettings() {
    const { columns, digestEmail, setDigestEmail, digestHour, setDigestHour } = useFeedStore()

    const [emailInput, setEmailInput] = useState(digestEmail || '')
    const [hourInput, setHourInput] = useState(digestHour ?? 7)
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const [open, setOpen] = useState(false)

    const handleSave = () => {
        setDigestEmail(emailInput)
        setDigestHour(hourInput)
    }

    const handleSendNow = async () => {
        if (!emailInput) return
        setStatus('sending')
        setErrorMsg('')
        try {
            const res = await fetch('/api/digest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput,
                    columns: columns.map(c => ({
                        title: c.title,
                        url: c.url,
                        sourceName: c.sourceName,
                    })),
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setErrorMsg(data.error || '送信に失敗しました')
                setStatus('error')
                return
            }
            setStatus('success')
            handleSave()
            setTimeout(() => {
                setStatus('idle')
                setOpen(false)
            }, 2500)
        } catch {
            setErrorMsg('ネットワークエラーが発生しました')
            setStatus('error')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground relative shrink-0"
                    aria-label="朝のダイジェスト設定"
                    title="朝のダイジェスト配信"
                >
                    <Mail className="h-5 w-5" />
                    {digestEmail && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Mail className="h-4 w-4 text-primary" />
                        朝のダイジェスト配信
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        毎朝、各カラムのトップ5記事をメールにまとめて送信します。通勤中にさっと確認できます。
                    </p>

                    {/* Email input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="digest-email" className="text-sm font-medium">
                            送信先メールアドレス
                        </Label>
                        <Input
                            id="digest-email"
                            type="email"
                            placeholder="your@gmail.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Delivery time */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            配信時刻
                        </Label>
                        <div className="flex gap-2 flex-wrap">
                            {HOUR_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setHourInput(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                        hourInput === opt.value
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            ※ 自動スケジュール配信はVercel cronの設定が必要です
                        </p>
                    </div>

                    {/* Status messages */}
                    {status === 'success' && (
                        <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 rounded-lg px-3 py-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            メールを送信しました！受信トレイを確認してください。
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {errorMsg}
                        </div>
                    )}

                    {/* Columns preview */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">送信対象カラム（{columns.length}件）</Label>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                            {columns.map(col => (
                                <span
                                    key={col.id}
                                    className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-1 rounded-md"
                                >
                                    {col.title}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 text-sm"
                            onClick={handleSave}
                            disabled={status === 'sending'}
                        >
                            設定を保存
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 h-9 text-sm gap-1.5"
                            onClick={handleSendNow}
                            disabled={!emailInput || status === 'sending' || columns.length === 0}
                        >
                            {status === 'sending' ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />送信中…</>
                            ) : (
                                <><Send className="h-3.5 w-3.5" />今すぐ送る</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
