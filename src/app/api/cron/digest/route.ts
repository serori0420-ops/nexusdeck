import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Vercel Cron Job: 毎朝ダイジェストメールを送信
 * vercel.json に以下を設定してください:
 * { "crons": [{ "path": "/api/cron/digest", "schedule": "0 22 * * *" }] }
 * ※ 22:00 UTC = 7:00 JST (UTC+9)
 */
export async function GET(req: NextRequest) {
    // Vercel cronからのリクエストのみ許可
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app.vercel.app'

    // digest_email が設定されているユーザーを取得
    const { data: users, error } = await supabase
        .from('user_settings')
        .select('digest_email, digest_hour, columns')
        .not('digest_email', 'is', null)
        .neq('digest_email', '')

    if (error) {
        console.error('Failed to fetch users:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const currentHourJST = new Date().getUTCHours() + 9
    const targets = (users || []).filter(u => (u.digest_hour ?? 7) === currentHourJST % 24)

    const results = await Promise.allSettled(
        targets.map(async (user) => {
            const res = await fetch(`${baseUrl}/api/digest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.digest_email,
                    columns: user.columns || [],
                }),
            })
            return { email: user.digest_email, ok: res.ok }
        })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ sent, total: targets.length })
}
