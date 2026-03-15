import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createGoogleOAuthRepo } from "@/infra/oauth/google-oauth-repo";
import { createOAuthService } from "@/service/oauth-service";
import { getBaseUrl } from "@/lib/server-url";

/**
 * Google OAuthのauthorization codeをaccess token/refresh tokenに交換
 * クライアント側から呼ばれる
 */
export async function POST(request: NextRequest) {
    try {
        const { code, state } = await request.json();

        if (!code || !state) {
            return NextResponse.json(
                { error: "Authorization code and state are required" },
                { status: 400 },
            );
        }

        // OAuth CSRF保護: state パラメータの検証
        const cookieStore = await cookies();
        const savedState = cookieStore.get("oauth_state")?.value;

        if (!savedState || savedState !== state) {
            return NextResponse.json(
                { error: "Invalid state parameter. CSRF validation failed." },
                { status: 403 },
            );
        }

        // 一度検証に成功したら、リプレイできないようにCookieのstateを削除
        // 以降のいかなるレスポンス（エラー時含む）でもCookieが削除されるようにここで設定
        cookieStore.delete("oauth_state");

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

        // OAuthService を通じて Authorization Code をトークンに交換
        const oauthRepo = createGoogleOAuthRepo(clientId, clientSecret);
        const oauthService = createOAuthService(oauthRepo);
        const baseUrl = await getBaseUrl();

        const tokenResult = await oauthService.exchangeAuthCode(
            code,
            `${baseUrl}/auth/callback`,
        );

        if (tokenResult.isErr()) {
            console.error("Token exchange failed:", tokenResult.error);
            return NextResponse.json(
                { error: "Token exchange failed" },
                { status: 500 },
            );
        }

        const tokens = tokenResult.value;

        // リフレッシュトークンが存在する場合はサーバー側の一時Cookieに保存する
        // FirestoreへのDB保存は、フロントエンド側でFirebase Authログイン完了後に専用エンドポイントを呼んで行うように遅延させる

        const response = NextResponse.json({
            access_token: tokens.accessToken,
            id_token: tokens.idToken, // Firebaseにログインするためフロントに返す必要がある
            expires_in: tokens.expiresIn,
        });

        if (tokens.refreshToken) {
            response.cookies.set({
                name: "temp_google_refresh_token",
                value: tokens.refreshToken,
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
