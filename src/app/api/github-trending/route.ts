import { NextRequest, NextResponse } from 'next/server';

interface TrendingRepo {
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    summary: string;
    imageUrl: string;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || '';
    const since = searchParams.get('since') || 'daily';

    try {
        const langPath = language ? `/${encodeURIComponent(language)}` : '';
        const trendingUrl = `https://github.com/trending${langPath}?since=${since}`;

        const res = await fetch(trendingUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html',
            },
            next: { revalidate: 1800 }, // Cache for 30 minutes
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch GitHub Trending' }, { status: 500 });
        }

        const html = await res.text();
        const articles = parseTrendingHtml(html);

        return NextResponse.json({ articles });
    } catch (error) {
        console.error('GitHub Trending Error:', error);
        return NextResponse.json({ error: 'Failed to fetch GitHub Trending' }, { status: 500 });
    }
}

function parseTrendingHtml(html: string): TrendingRepo[] {
    const articles: TrendingRepo[] = [];

    // Each trending repo is in an <article class="Box-row">
    const articleBlocks = html.split(/class="Box-row"/g);
    // Skip the first element (before the first match)

    for (let i = 1; i < articleBlocks.length && articles.length < 25; i++) {
        const block = articleBlocks[i];

        // Extract repo name: <a href="/owner/repo" ...> or <h2 ...><a href="/owner/repo">
        const repoMatch = block.match(/<a[^>]+href="\/([^"]+)"[^>]*class="[^"]*"/);
        const repoPath = repoMatch?.[1]?.trim();
        if (!repoPath || repoPath.split('/').length !== 2) continue;

        const [owner, repo] = repoPath.split('/');
        const repoUrl = `https://github.com/${repoPath}`;

        // Extract description
        const descMatch = block.match(/<p[^>]*class="[^"]*"[^>]*>([\s\S]*?)<\/p>/);
        let description = descMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || '';
        description = description.replace(/\s+/g, ' ');

        // Extract language
        const langMatch = block.match(/<span[^>]*itemprop="programmingLanguage"[^>]*>([^<]+)<\/span>/);
        const lang = langMatch?.[1]?.trim() || '';

        // Extract stars today
        const starsMatch = block.match(/(\d[\d,]*)\s*stars?\s*today/i);
        const starsToday = starsMatch?.[1] || '';

        // Extract total stars
        const totalStarsMatch = block.match(/<a[^>]*href="\/[^"]*\/stargazers"[^>]*>\s*([\s\S]*?)<\/a>/);
        let totalStars = totalStarsMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || '';
        totalStars = totalStars.replace(/\s+/g, '').replace(/,/g, '');

        // Build summary
        const summaryParts: string[] = [];
        if (lang) summaryParts.push(`📝 ${lang}`);
        if (totalStars) summaryParts.push(`⭐ ${Number(totalStars).toLocaleString()}`);
        if (starsToday) summaryParts.push(`🔥 +${starsToday} today`);
        if (description) summaryParts.push(description);
        const summary = summaryParts.join(' · ');

        // Avatar image
        const avatarUrl = `https://github.com/${owner}.png?size=128`;

        articles.push({
            id: `gh-${repoPath}`,
            title: `${owner} / ${repo}`,
            url: repoUrl,
            source: 'GitHub',
            publishedAt: new Date().toISOString(),
            summary,
            imageUrl: avatarUrl,
        });
    }

    return articles;
}
