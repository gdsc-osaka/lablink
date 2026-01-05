"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authAdmin } from "@/firebase/admin";
import type { DecodedIdToken } from 'firebase-admin/auth';

//サーバー側で認証チェックする
//未認証の場合はログインページへリダイレクトする
export async function requireAuth(): Promise<DecodedIdToken> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if(!token) {
        redirect("/login");
    }
    try {
        const decodedToken = await authAdmin.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        redirect("/login");
    }
}

// IDトークンをhttpOnly Cookieに保存
export async function setAuthToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7日間
    });
}

// 認証トークンをCookieから削除
export async function removeAuthToken() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
}