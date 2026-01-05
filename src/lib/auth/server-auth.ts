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

//認証状態確認
export async function getAuthUser(): Promise<DecodedIdToken | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if(!token) {
        return null;
    }

    try {
        return await authAdmin.verifyIdToken(token);
    } catch (error) {
        return null;
    }
}