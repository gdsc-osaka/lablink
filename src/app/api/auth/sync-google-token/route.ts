import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/firebase/admin";
import { createTokenService } from "@/service/token-service";
import { googleTokenRepository } from "@/infra/token/google-token-repo";

const authAdmin = getAuthAdmin();
const tokenService = createTokenService(googleTokenRepository);

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 },
            );
        }

        const idToken = authHeader.split(" ")[1];
        if (!idToken) {
            return NextResponse.json(
                { error: "Missing ID token" },
                { status: 401 },
            );
        }

        // Firebase Auth IDトークンを検証してユーザーの UID を取得する
        let decodedToken;
        try {
            decodedToken = await authAdmin.verifyIdToken(idToken);
        } catch (verifyError) {
            console.error("Failed to verify Firebase ID token:", verifyError);
            return NextResponse.json(
                { error: "Invalid Firebase ID token" },
                { status: 401 },
            );
        }

        const userId = decodedToken.uid;

        // Cookie から一時保存した Oauth リフレッシュトークンを取得
        const refreshTokenCookie = request.cookies.get(
            "temp_google_refresh_token",
        );
        const refreshToken = refreshTokenCookie?.value;

        if (!refreshToken) {
            // リフレッシュトークンがない場合は正常終了（すでに保存済みか、初回で取得できなかったかのいずれか）
            return NextResponse.json({
                success: true,
                message: "No refresh token to sync",
            });
        }

        // リフレッシュトークンをサーバー側（Firestore）で保存する
        const tokenSaveResult = await tokenService.saveToken({
            userId,
            token: refreshToken,
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

        // Cookie を削除して完了
        const response = NextResponse.json({ success: true });
        response.cookies.delete("temp_google_refresh_token");

        return response;
    } catch (error) {
        console.error("Token sync endpoint error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
