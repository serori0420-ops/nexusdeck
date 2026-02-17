import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Supabase の認証 Cookie を確認
    const hasAuthCookie = request.cookies.getAll().some(
        (cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    )

    // 認証済みユーザーが /login にアクセスした場合のリダイレクト処理は削除
    // (クライアント側の状態と不整合が起きると無限ループやログイン不能になるため)

    // 未認証でもアプリは使える（localStorage で動作）
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
