import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface Article {
    id: string
    title: string
    url: string
    source: string
    publishedAt: string
    summary?: string
    imageUrl?: string
}

interface ColumnDigest {
    title: string
    articles: Article[]
}

/** Fetch articles for a single column via the internal feed API */
async function fetchColumnArticles(url: string, sourceName: string, baseUrl: string): Promise<Article[]> {
    try {
        const apiUrl = url.startsWith('/api/')
            ? `${baseUrl}${url}`
            : `${baseUrl}/api/feed?url=${encodeURIComponent(url)}&source=${encodeURIComponent(sourceName)}`
        const res = await fetch(apiUrl, { next: { revalidate: 0 } })
        if (!res.ok) return []
        const data = await res.json()
        return (data.articles || []).slice(0, 5) // Top 5 per column
    } catch {
        return []
    }
}

/** Build the HTML email body */
function buildEmailHtml(columns: ColumnDigest[], deliveryDate: string): string {
    const columnSections = columns
        .filter(col => col.articles.length > 0)
        .map(col => {
            const articleRows = col.articles.map(a => {
                const date = new Date(a.publishedAt).toLocaleString('ja-JP', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })
                return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
              <a href="${a.url}" style="color: #60a5fa; text-decoration: none; font-size: 14px; font-weight: 600; line-height: 1.4; display: block; margin-bottom: 4px;">
                ${escapeHtml(a.title)}
              </a>
              ${a.summary ? `<p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.5;">${escapeHtml(a.summary.slice(0, 120))}${a.summary.length > 120 ? '…' : ''}</p>` : ''}
              <div style="margin-top: 6px;">
                <span style="background: #1f2937; color: #6b7280; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${escapeHtml(a.source)}</span>
                <span style="color: #4b5563; font-size: 10px; margin-left: 6px;">${date}</span>
              </div>
            </td>
          </tr>`
            }).join('')

            return `
        <div style="margin-bottom: 32px;">
          <h2 style="color: #f9fafb; font-size: 16px; font-weight: 700; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
            📌 ${escapeHtml(col.title)}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${articleRows}
          </table>
        </div>`
        }).join('')

    return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>NexusDeck 朝のダイジェスト</title></head>
<body style="background-color: #0f172a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0;">
  <div style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-flex; align-items: center; gap: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 12px 20px;">
        <div style="background: #3b82f6; width: 28px; height: 28px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-weight: 800; font-size: 16px;">N</span>
        </div>
        <span style="color: #f8fafc; font-weight: 700; font-size: 18px;">NexusDeck</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-top: 12px;">📅 ${deliveryDate} の朝のダイジェスト</p>
    </div>

    <!-- Columns -->
    ${columnSections || '<p style="color: #64748b; text-align: center;">記事が見つかりませんでした</p>'}

    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: center;">
      <p style="color: #374151; font-size: 11px; margin: 0;">
        NexusDeck により配信 · このメールはあなたの設定にもとづいて送信されています
      </p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, columns } = body as {
            email: string
            columns: Array<{ title: string; url: string; sourceName: string }>
        }

        if (!email || !columns || columns.length === 0) {
            return NextResponse.json({ error: 'email と columns は必須です' }, { status: 400 })
        }

        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: 'RESEND_API_KEY が設定されていません' }, { status: 500 })
        }

        // Base URL for internal API calls
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`

        // Fetch articles for all columns in parallel
        const columnDigests: ColumnDigest[] = await Promise.all(
            columns.map(async (col) => ({
                title: col.title,
                articles: await fetchColumnArticles(col.url, col.sourceName, baseUrl),
            }))
        )

        const deliveryDate = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        })

        const html = buildEmailHtml(columnDigests, deliveryDate)
        const totalArticles = columnDigests.reduce((sum, c) => sum + c.articles.length, 0)

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'NexusDeck <digest@resend.dev>',
            to: [email],
            subject: `📰 NexusDeck 朝のダイジェスト｜${deliveryDate}`,
            html,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, id: data?.id, totalArticles })
    } catch (e) {
        console.error('Digest API error:', e)
        return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
    }
}
