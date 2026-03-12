import { NextRequest, NextResponse } from "next/server";

// 公開ルート（これら以外はすべてログイン必須とする）
const publicRoutes = ["/", "/login"];

// 楽観的チェックのみ行う
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("session");

    const isPublicRoute = publicRoutes.includes(pathname);

    // 公開ルートではなく、かつセッションクッキーがない → /login へリダイレクト
    if (!isPublicRoute && !sessionCookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // ログインページ + セッションクッキーあり → /group へリダイレクト
    if (pathname === "/login" && sessionCookie) {
        return NextResponse.redirect(new URL("/group", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
    ],
};
