import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Supabase の認証 Cookie を確認
    const hasAuthCookie = request.cookies.getAll().some(
        (cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    )

    // 認証済みユーザーが /login にアクセスしたらトップへリダイレクト
    if (hasAuthCookie && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // 未認証でもアプリは使える（localStorage で動作）
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
