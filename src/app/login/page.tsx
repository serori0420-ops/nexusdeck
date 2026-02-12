"use client"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export default function LoginPage() {
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

                {/* Login Card */}
                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-sm">
                    <h2 className="mb-1 text-center text-lg font-semibold">ログイン</h2>
                    <p className="mb-6 text-center text-xs text-muted-foreground">
                        アカウントでサインインしてください
                    </p>

                    <Button
                        className="w-full gap-3 h-11 text-sm font-medium"
                        onClick={handleGitHubLogin}
                    >
                        <Github className="h-5 w-5" />
                        GitHubでログイン
                    </Button>

                    <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
                        ログインすると、設定がクラウドに保存され
                        <br />
                        どのデバイスからでもアクセスできます
                    </p>
                </div>
            </div>
        </div>
    )
}
