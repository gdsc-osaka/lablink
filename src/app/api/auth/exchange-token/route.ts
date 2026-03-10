import { NextRequest, NextResponse } from "next/server";
import { createServerAuthRepo } from "@/infra/auth/server-auth-repo";

/**
 * Google OAuthのauthorization codeをaccess token/refresh tokenに交換
 * クライアント側から呼ばれる
 */
export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: "Authorization code is required" },
                { status: 400 },
            );
        }

        // 環境変数のバリデーション
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                {
                    error: "Server configuration error: Google OAuth credentials are missing",
                },
                { status: 500 },
            );
        }

        // googleapis の OAuth2Client を通じて Authorization Code をトークンに交換
        const authRepo = createServerAuthRepo(clientId, clientSecret);
        const tokens = await authRepo.exchangeAuthCode(
            code,
            `${request.nextUrl.origin}/auth/callback`,
        );

        // リフレッシュトークンが存在する場合はサーバー側の一時Cookieに保存する
        // FirestoreへのDB保存は、フロントエンド側でFirebase Authログイン完了後に専用エンドポイントを呼んで行うように遅延させる

        const response = NextResponse.json({
            access_token: tokens.access_token,
            id_token: tokens.id_token, // Firebaseにログインするためフロントに返す必要がある
            expires_in: tokens.expires_in,
        });

        if (tokens.refresh_token) {
            response.cookies.set({
                name: "temp_google_refresh_token",
                value: tokens.refresh_token,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 10, // 10 minutes
            });
        }

        return response;
    } catch (error) {
        console.error("Token exchange endpoint error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
