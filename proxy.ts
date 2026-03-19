import { NextRequest, NextResponse } from "next/server";

// 公開ルート（これら以外はすべてログイン必須とする）
const publicRoutes = ["/", "/login"];

// 楽観的チェックのみ行う
export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const sessionCookie = request.cookies.get("session");

    const isPublicRoute = publicRoutes.includes(pathname);

    // 公開ルートではなく、かつセッションクッキーがない → /login へリダイレクト
    if (!isPublicRoute && !sessionCookie) {
        const url = new URL("/login", request.url);
        url.searchParams.set("redirectTo", pathname + search);
        return NextResponse.redirect(url);
    }

    // ログインページ + セッションクッキーあり → /group へリダイレクト
    // ただし、redirectToパラメータがある場合は（セッション切れなどで明示的に飛ばされてきた可能性があるため）リダイレクトしない
    if (
        pathname === "/login" &&
        sessionCookie &&
        !request.nextUrl.searchParams.has("redirectTo")
    ) {
        return NextResponse.redirect(new URL("/group", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
    ],
};
