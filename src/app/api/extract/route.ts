import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

/**
 * 記事のURLを受け取り、本文をMarkdownに変換して返すAPIエンドポイント。
 * Readabilityで本文を抽出し、Turndownでマークダウンに変換する。
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const title = searchParams.get('title') || '';

    if (!url) {
        return NextResponse.json({ error: 'URLパラメータが必要です' }, { status: 400 });
    }

    try {
        // 対象URLのHTMLを取得
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NexusDeck/1.0; +https://nexusdeck.vercel.app)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(15000), // 15秒タイムアウト
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `記事の取得に失敗しました (HTTP ${response.status})` },
                { status: 502 }
            );
        }

        const html = await response.text();

        // JSDOMでDOMツリーを構築し、Readabilityで本文を抽出
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article || !article.content) {
            return NextResponse.json(
                { error: 'この記事からは本文を抽出できませんでした。' },
                { status: 422 }
            );
        }

        // TurndownでHTMLをMarkdownに変換
        const turndown = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
        });

        const markdownBody = turndown.turndown(article.content);

        // Frontmatter（メタデータ）を付加
        const articleTitle = title || article.title || 'Untitled';
        const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const markdown = [
            '---',
            `title: "${articleTitle.replace(/"/g, '\\"')}"`,
            `source: "${url}"`,
            `clipped: ${now}`,
            '---',
            '',
            `# ${articleTitle}`,
            '',
            `> 元記事: [${articleTitle}](${url})`,
            '',
            markdownBody,
        ].join('\n');

        return NextResponse.json({
            title: articleTitle,
            markdown,
        });
    } catch (error) {
        console.error('Extract API Error:', error);
        const message = error instanceof Error ? error.message : '不明なエラーが発生しました';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
