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
        throw new Error("Failed to create session");
    }
}

// サーバー側で認証チェックする
// 未認証の場合はログインページへリダイレクトする
export const requireAuth = cache(async (): Promise<DecodedIdToken> => {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
        redirect("/login");
    }

    try {
        const decodedClaims = await getAuthAdmin().verifySessionCookie(
            sessionCookie,
            true,
        );
        return decodedClaims;
    } catch (error) {
        redirect("/login");
    }
});

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
