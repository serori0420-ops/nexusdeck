import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * ブックマーク一覧取得API（Scout連携用）
 *
 * Claude Code の news-scout Skill から呼び出されるエンドポイント。
 * スマホ・PCでブックマークした記事をScoutが吸い上げ、ObsidianVaultのNews/フォルダに保存するための橋渡し役。
 *
 * 認証: SCOUT_API_KEY（環境変数）によるシンプルなAPIキー認証
 *
 * 使用例:
 *   GET /api/bookmarks?key=your_scout_api_key
 *   GET /api/bookmarks?key=your_scout_api_key&clear=true  // 取得後にブックマークをクリア
 */
export async function GET(request: NextRequest) {
    // APIキー認証
    const key = request.nextUrl.searchParams.get('key');
    const scoutApiKey = process.env.SCOUT_API_KEY;

    if (!scoutApiKey) {
        return NextResponse.json(
            { error: 'SCOUT_API_KEY が環境変数に設定されていません' },
            { status: 500 }
        );
    }
    if (key !== scoutApiKey) {
        return NextResponse.json(
            { error: '認証エラー：APIキーが無効です' },
            { status: 401 }
        );
    }

    // Service Role Key で Supabase に接続（RLSをバイパス）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { error: 'Supabase の環境変数が不足しています（SUPABASE_SERVICE_ROLE_KEY を確認してください）' },
            { status: 500 }
        );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        // user_settings テーブルから全ユーザーのブックマークを取得
        // （個人利用のため全件取得。複数ユーザーがいる場合は user_id でフィルタ可能）
        const { data, error } = await supabase
            .from('user_settings')
            .select('user_id, bookmarks, updated_at')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // ブックマークを統合して返す
        const allBookmarks = data?.flatMap((row) =>
            Array.isArray(row.bookmarks) ? row.bookmarks : []
        ) ?? [];

        // 重複URLを除去（同じURLが複数ユーザーにある場合）
        const seen = new Set<string>();
        const uniqueBookmarks = allBookmarks.filter((b) => {
            if (!b.url || seen.has(b.url)) return false;
            seen.add(b.url);
            return true;
        });

        // clear=true の場合はブックマークをクリア
        const shouldClear = request.nextUrl.searchParams.get('clear') === 'true';
        if (shouldClear && data && data.length > 0) {
            await Promise.all(
                data.map((row) =>
                    supabase
                        .from('user_settings')
                        .update({ bookmarks: [] })
                        .eq('user_id', row.user_id)
                )
            );
        }

        return NextResponse.json({
            count: uniqueBookmarks.length,
            cleared: shouldClear,
            bookmarks: uniqueBookmarks,
        });
    } catch (error) {
        console.error('Bookmarks API Error:', error);
        const message = error instanceof Error ? error.message : '不明なエラー';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
