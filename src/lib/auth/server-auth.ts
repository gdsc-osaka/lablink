import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authAdmin } from "@/firebase/admin";
import type { DecodedIdToken } from 'firebase-admin/auth';

// セッションクッキー作成（IDトークンから）
// クライアントコンポーネントからサーバーアクションとして呼び出す
export async function createAuthSession(idToken: string) {
    "use server";

    // 14日間有効なセッションクッキーを作成
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14日間（ミリ秒）

    try {
        const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

        const cookieStore = await cookies();
        cookieStore.set("session", sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: expiresIn / 1000, // 秒に変換
        });
    } catch (error) {
        throw new Error("Failed to create session");
    }
}

// サーバー側で認証チェックする
// 未認証の場合はログインページへリダイレクトする
export async function requireAuth(): Promise<DecodedIdToken> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
        redirect("/login");
    }

    try {
        // セッションクッキーを検証（checkRevoked: true で無効化されたトークンを拒否）
        const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);
        return decodedClaims;
    } catch (error) {
        redirect("/login");
    }
}

// セッション削除
// クライアントコンポーネントからサーバーアクションとして呼び出す
export async function removeAuthSession() {
    "use server";
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    // セッションを無効化（リフレッシュトークンを取り消し）
    if (sessionCookie) {
        try {
            const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie);
            await authAdmin.revokeRefreshTokens(decodedClaims.sub);
        } catch (error) {
            // エラーは無視（既に無効なセッションの可能性）
        }
    }

    cookieStore.delete("session");
}