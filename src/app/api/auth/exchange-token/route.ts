import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createGoogleOAuthRepo } from "@/infra/oauth/google-oauth-repo";
import { createOAuthService } from "@/service/oauth-service";
import { getBaseUrl } from "@/lib/server-url";
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
        const { code, state } = await request.json();

        if (
            typeof code !== "string" ||
            code.trim() === "" ||
            typeof state !== "string" ||
            state.trim() === ""
        ) {
            return NextResponse.json(
                {
                    error: "Authorization code and state are required",
                },
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

        // セッションクッキーからユーザーの UID を取得する
        const sessionCookie = cookieStore.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            );
        }

        let decodedToken;
        try {
            decodedToken = await authAdmin.verifySessionCookie(
                sessionCookie,
                true,
            );
        } catch (verifyError) {
            console.error("Failed to verify session cookie:", verifyError);
            return NextResponse.json(
                { error: "Invalid or expired session" },
                { status: 401 },
            );
        }

        const userId = decodedToken.uid;

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

        // Googleからリフレッシュトークンが返却されなかった場合はエラーとする
        if (!tokens.refreshToken) {
            console.error("No refresh token returned from Google OAuth");
            return NextResponse.json(
                { error: "Missing refresh token from provider" },
                { status: 500 },
            );
        }

        // リフレッシュトークンが存在する場合はサーバー側（Firestore）で保存する
        const tokenSaveResult = await tokenService.saveToken({
            userId,
            token: tokens.refreshToken,
            serviceType: "google",
            expiresAt: null,
        });

        if (tokenSaveResult.isErr()) {
            console.error(
                "Failed to save refresh token:",
                tokenSaveResult.error,
            );
            return NextResponse.json(
                { error: "Failed to persist refresh token" },
                { status: 500 },
            );
        }

        // アクセストークンはサーバー側でのみ使用し、クライアントには返さない
        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Token exchange endpoint error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
