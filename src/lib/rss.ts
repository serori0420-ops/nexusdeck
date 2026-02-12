import { parseStringPromise } from 'xml2js';
import dayjs from 'dayjs';
import { Article } from '@/components/feed/feed-card';

/**
 * Check if a URL is a Google News/Alerts redirect URL
 */
function isGoogleNewsUrl(url: string): boolean {
    return /^https?:\/\/news\.google\.com\/rss\/articles\//.test(url) ||
        /^https?:\/\/www\.google\.\w+\/url\?/.test(url) ||
        /^https?:\/\/news\.google\.com\/stories\//.test(url);
}

/**
 * Resolve Google redirect URL (google.com/url?... format) to actual URL
 */
function resolveGoogleRedirectUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.get('url') || parsed.searchParams.get('q') || null;
    } catch {
        return null;
    }
}

/**
 * Fetch OG image from a page URL
 * - For Google News/Alerts: skip (handled separately via source domain)
 * - For Qiita: uses API v2 to get images from rendered_body or user avatar
 * - For others: fetches HTML and extracts og:image meta tag
 */
async function fetchOgImage(pageUrl: string, sourceDomain?: string): Promise<string> {
    try {
        // Google redirect URL (google.com/url?url=...) — resolve and fetch actual page
        if (/^https?:\/\/www\.google\.\w+\/url\?/.test(pageUrl)) {
            const realUrl = resolveGoogleRedirectUrl(pageUrl);
            if (realUrl) return fetchOgImage(realUrl);
            return '';
        }

        // Google News redirect URL — can't resolve via fetch, use source domain favicon
        if (isGoogleNewsUrl(pageUrl)) {
            if (sourceDomain) {
                // Use Google's high-res favicon/touch-icon service
                return `https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=128`;
            }
            return '';
        }

        // Qiita-specific: use API to get article images
        const qiitaMatch = pageUrl.match(/qiita\.com\/([^/]+)\/items\/([a-f0-9]+)/);
        if (qiitaMatch) {
            const itemId = qiitaMatch[2];
            const apiRes = await fetch(`https://qiita.com/api/v2/items/${itemId}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(5000),
            });
            if (apiRes.ok) {
                const data = await apiRes.json();
                // Try to find first image in rendered_body
                if (data.rendered_body) {
                    const imgMatch = data.rendered_body.match(/<img[^>]+src=["']([^"']+)["']/i);
                    if (imgMatch?.[1]) return imgMatch[1];
                }
                // Fallback to user avatar
                if (data.user?.profile_image_url) {
                    return data.user.profile_image_url;
                }
            }
            return '';
        }

        // Generic OGP extraction
        const res = await fetch(pageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return '';
        const html = await res.text();
        // Look for og:image meta tag
        const ogMatch = html.match(
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
        ) || html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
        );
        return ogMatch?.[1] || '';
    } catch {
        return '';
    }
}

/**
 * Extract image URL from an RSS item using multiple strategies
 */
function extractImageFromItem(item: any): string {
    // 1. media:content / media:thumbnail
    if (item['media:content']?.url) return item['media:content'].url;
    if (item['media:content']?.[0]?.url) return item['media:content'][0].url;
    if (item['media:thumbnail']?.url) return item['media:thumbnail'].url;
    if (item['media:thumbnail']?.[0]?.url) return item['media:thumbnail'][0].url;

    // 2. enclosure (relaxed check — don't require type to be image/*)
    if (item.enclosure?.url) {
        const url = item.enclosure.url as string;
        // Accept if type starts with image/ OR url looks like an image
        if (
            item.enclosure.type?.startsWith('image/') ||
            /\.(jpe?g|png|gif|webp|avif|svg)/i.test(url) ||
            url.includes('image') ||
            url.includes('cloudinary') ||
            url.includes('res.cloudinary')
        ) {
            return url;
        }
    }
    if (Array.isArray(item.enclosure)) {
        for (const e of item.enclosure) {
            if (e.url && (e.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp)/i.test(e.url))) {
                return e.url;
            }
        }
    }

    // 3. Extract first <img> from HTML content
    // Handle both string content and object content (Atom feeds: {_: "html...", type: "html"})
    const rawContent = item['content:encoded'] || item.content || item.description || '';
    const contentToCheck = typeof rawContent === 'object' ? (rawContent._ || rawContent.$ || '') : rawContent;
    if (typeof contentToCheck === 'string' && contentToCheck.length > 0) {
        const imgMatch = contentToCheck.match(
            /<img[^>]+src=["']([^"']+)["']/i
        );
        if (imgMatch?.[1]) return imgMatch[1];
    }

    return '';
}

export async function fetchRSS(url: string, sourceName: string): Promise<Article[]> {
    try {
        const response = await fetch(url, {
            next: { revalidate: 300 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/xml, application/atom+xml, application/rss+xml, text/xml;q=0.9, */*;q=0.8'
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch RSS from ${url}: ${response.statusText}`);
            return [];
        }

        const xml = await response.text();
        const result = await parseStringPromise(xml, {
            explicitArray: false,
            mergeAttrs: true,
        });

        let items: any[] = [];

        // Handle RSS 2.0 / RSS 1.0 (item)
        if (result.rss?.channel?.item) {
            items = Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item];
        } else if (result['rdf:RDF']?.item) {
            items = Array.isArray(result['rdf:RDF'].item) ? result['rdf:RDF'].item : [result['rdf:RDF'].item];
        }
        // Handle Atom (entry) - used by Qiita, Publickey etc.
        else if (result.feed?.entry) {
            items = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
        }

        // Helper to extract text from possible object (Atom style)
        const getText = (val: any): string => {
            if (!val) return '';
            if (typeof val === 'string') return val;
            if (typeof val === 'object') return val._ || val.$ || '';
            return String(val);
        };

        // Parse items (without OG image — fast)
        const articles: (Article & { _sourceDomain?: string })[] = items.map((item: any) => {
            const title = getText(item.title) || 'No Title';

            let link = '';
            if (typeof item.link === 'string') {
                link = item.link;
            } else if (item.link?.href) {
                link = item.link.href;
            } else if (Array.isArray(item.link)) {
                const htmlLink = item.link.find((l: any) => l.type === 'text/html' || l.rel === 'alternate');
                link = htmlLink?.href || item.link[0]?.href || '';
            }

            const pubDate = item.pubDate || item['dc:date'] || item.published || item.updated || new Date().toISOString();

            const summaryRaw = item.description || item['content:encoded'] || item.summary || item.content || '';
            const summaryText = getText(summaryRaw);
            const summary = summaryText.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 150) + (summaryText.length > 150 ? '...' : '');

            const imageUrl = extractImageFromItem(item);

            // Extract source domain (used for Google News favicon fallback)
            let _sourceDomain: string | undefined;
            if (item.source?.url) {
                try { _sourceDomain = new URL(item.source.url).hostname; } catch { }
            }

            return {
                id: link || `${sourceName}-${dayjs(pubDate).valueOf()}`,
                title,
                url: link,
                source: sourceName,
                publishedAt: dayjs(pubDate).toISOString(),
                summary,
                imageUrl,
                _sourceDomain,
            };
        }).filter(article => article.url);

        // For articles missing images, try OG image fetch (limit to first 10 for performance)
        const articlesNeedingOg = articles
            .map((a, i) => ({ article: a, index: i }))
            .filter(({ article }) => !article.imageUrl)
            .slice(0, 10);

        if (articlesNeedingOg.length > 0) {
            const ogResults = await Promise.allSettled(
                articlesNeedingOg.map(({ article }) => fetchOgImage(article.url, article._sourceDomain))
            );

            ogResults.forEach((result, i) => {
                if (result.status === 'fulfilled' && result.value) {
                    articles[articlesNeedingOg[i].index].imageUrl = result.value;
                }
            });
        }

        return articles;

    } catch (error) {
        console.error(`Error parsing RSS from ${url}:`, error);
        return [];
    }
}
