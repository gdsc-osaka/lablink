import { NextRequest, NextResponse } from 'next/server';

// 認証が必要なルート（(auth)フォルダ内のルート）
const protectedRoutes = [
    '/group',
    '/ai-suggest',
    '/complete',
    '/create-event',
    '/create-group',
    '/edit-event',
    '/invite',
    '/invited',
];

// 公開ルート
const publicRoutes = ['/', '/login'];

/**
 * Proxy - 楽観的リダイレクトのみ
 *
 * 🚨 CVE-2025-29927 セキュリティ対策：
 * - トークンの検証は行わない（x-middleware-subrequest ヘッダーバイパスを防ぐため）
 * - クッキーの有無のみで判定（高速な楽観的チェック）
 * - セキュアな検証はServer Components/Server Actionsで実施
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get('session');

    // 保護されたルート + セッションクッキーなし → /login へリダイレクト
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute && !sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // ログインページ + セッションクッキーあり → /group へリダイレクト
    if (pathname === '/login' && sessionCookie) {
        return NextResponse.redirect(new URL('/group', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // 静的ファイルと画像を除外
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)'],
};
