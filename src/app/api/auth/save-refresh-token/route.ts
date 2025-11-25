import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/encryption";
import { adminDb, adminAuth } from "@/firebase/server";

/**
 * リフレッシュトークンを暗号化してFirestoreに保存する
 * クライアント側から呼ばれる（Firebase ID Token で認証）
 */
export async function POST(request: NextRequest) {
    try {
        // Firebase ID Token を取得して検証
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { refresh_token } = await request.json();

        if (!refresh_token) {
            return NextResponse.json(
                { error: "Refresh token is required" },
                { status: 400 }
            );
        }

        // リフレッシュトークンを暗号化
        const encryptedRefreshToken = encryptToken(refresh_token);

        // Admin SDK で /users/{userId}/private/tokens に保存
        await adminDb
            .collection("users")
            .doc(userId)
            .collection("private")
            .doc("tokens")
            .set({
                google_refresh_token_encrypted: encryptedRefreshToken,
                google_token_expires_at: new Date(),
                updated_at: new Date(),
            });

        console.log(`Refresh token saved for user: ${userId}`);

        return NextResponse.json({
            success: true,
            message: "Refresh token saved successfully",
        });
    } catch (error) {
        console.error("Token save error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
