import { NextRequest, NextResponse } from 'next/server';
import { fetchRSS } from '@/lib/rss';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const source = searchParams.get('source') || 'RSS';

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const articles = await fetchRSS(url, source);
        return NextResponse.json({ articles });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
    }
}
