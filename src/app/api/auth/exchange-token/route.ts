import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/firebase/admin";
import { createTokenService } from "@/service/token-service";
import { googleTokenRepository } from "@/infra/token/google-token-repo";

const authAdmin = getAuthAdmin();
const tokenService = createTokenService(googleTokenRepository);

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

        // Authorization Code を Access Token と Refresh Token に交換
        const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: `${request.nextUrl.origin}/auth/callback`,
                    grant_type: "authorization_code",
                }),
            },
        );

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error(
                "Failed to exchange authorization code with OAuth provider:",
                errorText,
            );
            return NextResponse.json(
                {
                    error: "Failed to exchange authorization code",
                },
                { status: 500 },
            );
        }

        const tokens = await tokenResponse.json();

        // リフレッシュトークンが存在する場合はサーバー側の一時Cookieに保存する
        // FirestoreへのDB保存は、フロントエンド側でFirebase Authログイン完了後に専用エンドポイントを呼んで行うように遅延させる
        if (tokens.refresh_token) {
            request.cookies.set(
                "temp_google_refresh_token",
                tokens.refresh_token,
            );
            // ※ NextRequest では request.cookies.set を使って response の cookies に直接反映させることは通常できません。
            // 応答の NextResponse にセットする必要があります。
        }

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
