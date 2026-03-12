import NextAuth from "next-auth";
import authConfig from "./src/auth.config";
import { NextResponse } from "next/server";

export const { auth: middleware } = NextAuth(authConfig);

// 認証が必要なルート
const protectedRoutes = [
    "/group",
    "/ai-suggest",
    "/complete",
    "/create-event",
    "/create-group",
    "/edit-event",
    "/invite",
    "/invited",
];

export default middleware((req) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // 保護されたルート + セッションなし → /login へリダイレクト
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route),
    );

    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // ログインページ + セッションあり → /group へリダイレクト
    if (pathname === "/login" && session) {
        return NextResponse.redirect(new URL("/group", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
    ],
};
