import { NextRequest, NextResponse } from 'next/server';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

/**
 * 記事のURLを受け取り、本文をMarkdownに変換して返すAPIエンドポイント。
 * linkedom（軽量DOMパーサー）+ Readabilityで本文を抽出し、Turndownでマークダウンに変換する。
 * linkedomはネイティブ依存がないため、Vercelのサーバーレス環境でも安定して動作する。
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
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

        // linkedomでDOMツリーを構築し、Readabilityで本文を抽出
        const { document } = parseHTML(html);

        // Readabilityが必要とするプロパティをセット
        if (url) {
            try {
                const parsedUrl = new URL(url);
                // documentURIをセットすることで相対URLの解決が可能になる
                Object.defineProperty(document, 'documentURI', {
                    value: url,
                    writable: false,
                });
                // baseURIが未定義の場合のフォールバック
                if (!document.baseURI || document.baseURI === 'about:blank') {
                    const base = document.createElement('base');
                    base.href = parsedUrl.origin;
                    document.head?.appendChild(base);
                }
            } catch {
                // URL解析が失敗しても処理は続行
            }
        }

        const reader = new Readability(document as unknown as Document);
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
