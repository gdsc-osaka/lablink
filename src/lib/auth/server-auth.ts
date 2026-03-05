"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthAdmin } from "@/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { cache } from "react";

// セッションクッキー作成（IDトークンから）
// CCからServer Actionとして呼び出す
export async function createAuthSession(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14日間

    try {
        const sessionCookie = await getAuthAdmin().createSessionCookie(
            idToken,
            {
                expiresIn,
            },
        );

        const cookieStore = await cookies();
        cookieStore.set("session", sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: expiresIn / 1000,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to create session:", message);
        throw new Error(`Failed to create session: ${message}`, {
            cause: error,
        });
    }
}

/**
 * サーバーサイドで認証状態をチェック
 * 未認証の場合はログインページへリダイレクト（この関数は値を返さずに終了）
 *
 * @param searchParams リダイレクト先で保持したいパラメータ（例: 招待トークン）
 * @returns 認証済みの場合はデコードされたIDトークンを返す。未認証の場合はリダイレクトするため返り値はない。
 */
export const requireAuth = cache(
    async (searchParams?: {
        token?: string;
    }): Promise<DecodedIdToken | never> => {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (sessionCookie) {
            try {
                const decodedClaims = await getAuthAdmin().verifySessionCookie(
                    sessionCookie,
                    true,
                );
                return decodedClaims;
            } catch (error) {
                // セッションが無効な場合はリダイレクト処理へ進む
            }
        }

        // tokenが存在する場合は、ログイン後に招待ページへ戻るようにリダイレクト先を指定
        const redirectUrl = searchParams?.token
            ? `/login?redirectTo=${encodeURIComponent(`/invited?token=${searchParams.token}`)}`
            : "/login";
        redirect(redirectUrl);
    },
);

// セッション取得（リダイレクトなし）
export const getSession = cache(async (): Promise<DecodedIdToken | null> => {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedClaims = await getAuthAdmin().verifySessionCookie(
            sessionCookie,
            true,
        );
        return decodedClaims;
    } catch (error) {
        return null;
    }
});

// セッション削除
// CCからServer Actionとして呼び出す
export async function removeAuthSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    // セッションを無効化（リフレッシュトークンを取り消し）
    if (sessionCookie) {
        try {
            const decodedClaims =
                await getAuthAdmin().verifySessionCookie(sessionCookie);
            await getAuthAdmin().revokeRefreshTokens(decodedClaims.sub);
        } catch (error) {}
    }

    cookieStore.delete("session");
}
