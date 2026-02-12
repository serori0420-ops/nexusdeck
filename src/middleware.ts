import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Supabase の認証 Cookie を確認（sb-<project>-auth-token）
    const hasAuthCookie = request.cookies.getAll().some(
        (cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    )

    // 未認証ユーザーを /login にリダイレクト
    if (
        !hasAuthCookie &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 認証済みユーザーが /login にアクセスしたらトップへ
    if (hasAuthCookie && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
