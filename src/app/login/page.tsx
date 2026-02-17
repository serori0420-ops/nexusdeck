"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Github, Smartphone, MonitorSmartphone, ArrowRight } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()

    useEffect(() => {
        // すでにログイン済みならトップへ
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.replace("/")
            }
        })
    }, [router])

    const handleGitHubLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            {/* Background glow */}
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
                <div className="h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-sm px-6">
                {/* Logo & Title */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                        <span className="text-2xl font-bold text-primary-foreground">N</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">NexusDeck</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        あなた専用のニュースダッシュボード
                    </p>
                </div>

                {/* Mode Selection */}
                <div className="space-y-3">
                    {/* Cloud Sync Mode */}
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-sm">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                                <MonitorSmartphone className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">クラウド同期モード</h2>
                                <p className="text-[11px] text-muted-foreground">
                                    PC・スマホで設定を共有
                                </p>
                            </div>
                        </div>
                        <Button
                            className="w-full gap-3 h-10 text-sm font-medium"
                            onClick={handleGitHubLogin}
                        >
                            <Github className="h-4 w-4" />
                            GitHubでログイン
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border/60" />
                        <span className="text-[11px] text-muted-foreground/60">または</span>
                        <div className="h-px flex-1 bg-border/60" />
                    </div>

                    {/* Local Mode */}
                    <div className="rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">ローカルモード</h2>
                                <p className="text-[11px] text-muted-foreground">
                                    このデバイスだけで使う
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full gap-2 h-10 text-sm"
                            onClick={() => router.push("/")}
                        >
                            ログインせずに使う
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <p className="mt-2.5 text-center text-[10px] text-muted-foreground/50">
                            設定はこのブラウザにのみ保存されます
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
