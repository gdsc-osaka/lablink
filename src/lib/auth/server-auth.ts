"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * サーバーサイドで認証状態をチェック
 * 未認証の場合はログインページへリダイレクト
 */
export const requireAuth = cache(async (searchParams?: { token?: string }) => {
    const session = await auth();

    if (session?.user?.id) {
        return {
            uid: session.user.id,
            email: session.user.email || undefined,
            name: session.user.name || undefined,
            picture: session.user.image || undefined,
        };
    }

    const redirectUrl = searchParams?.token
        ? `/login?redirectTo=${encodeURIComponent(`/invited?token=${searchParams.token}`)}`
        : "/login";
    redirect(redirectUrl);
});

// セッション取得（リダイレクトなし）
export const getSession = cache(async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    return {
        uid: session.user.id,
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        picture: session.user.image || undefined,
    };
});
