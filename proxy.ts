import { NextRequest, NextResponse } from 'next/server';

// 認証が必要なルート
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

// 楽観的チェックのみ行う
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
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)'],
};
