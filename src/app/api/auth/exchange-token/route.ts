import { NextRequest, NextResponse } from "next/server";

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

        // トークン情報をクライアントに返す
        return NextResponse.json({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id_token: tokens.id_token,
            expires_in: tokens.expires_in,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
