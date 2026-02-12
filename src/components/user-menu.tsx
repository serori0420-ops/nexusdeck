"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function UserMenu() {
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    if (!user) return null

    const avatarUrl = user.user_metadata?.avatar_url
    const displayName = user.user_metadata?.user_name || user.email || "User"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-border/50 hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                    <p className="text-sm font-medium">{displayName}</p>
                    {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
