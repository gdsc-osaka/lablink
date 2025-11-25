import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/encryption";

/**
 * リフレッシュトークンを暗号化して返す
 * クライアント側から呼ばれる
 */
export async function POST(request: NextRequest) {
    try {
        const { refresh_token } = await request.json();

        if (!refresh_token) {
            return NextResponse.json(
                { error: "Refresh token is required" },
                { status: 400 }
            );
        }

        // リフレッシュトークンを暗号化
        const encryptedRefreshToken = encryptToken(refresh_token);

        return NextResponse.json({
            encrypted_refresh_token: encryptedRefreshToken,
        });
    } catch (error) {
        console.error("Token encryption error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
