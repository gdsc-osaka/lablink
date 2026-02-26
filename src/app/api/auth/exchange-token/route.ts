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
            return NextResponse.json(
                {
                    error: "Failed to exchange authorization code",
                    details: errorText,
                },
                { status: 500 },
            );
        }

        const tokens = await tokenResponse.json();

        // 取得した ID Token を検証してユーザーの UID を取得する
        if (!tokens.id_token) {
            return NextResponse.json(
                { error: "No ID token returned from Google" },
                { status: 400 },
            );
        }

        let decodedToken;
        try {
            decodedToken = await authAdmin.verifyIdToken(tokens.id_token);
        } catch (verifyError) {
            console.error("Failed to verify ID token:", verifyError);
            return NextResponse.json(
                { error: "Invalid ID token" },
                { status: 401 },
            );
        }

        const userId = decodedToken.uid;

        // リフレッシュトークンが存在する場合はサーバー側（Firestore）で直接保存する
        if (tokens.refresh_token) {
            const tokenSaveResult = await tokenService.saveToken({
                userId,
                token: tokens.refresh_token,
                serviceType: "google",
                expiresAt: null,
            });

            if (tokenSaveResult.isErr()) {
                console.warn(
                    "Failed to save refresh token:",
                    tokenSaveResult.error,
                );
                // 保存に失敗しても、認証自体は成功しているので処理を継続する（必要に応じてエラーにしても良い）
            }
        }

        // トークン情報をクライアントに返す
        // セキュリティのため、リフレッシュトークンは絶対にブラウザに返してはならない
        return NextResponse.json({
            access_token: tokens.access_token,
            id_token: tokens.id_token, // Firebaseにログインするためフロントに返す必要がある
            expires_in: tokens.expires_in,
        });
    } catch (error) {
        console.error("Token exchange endpoint error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
