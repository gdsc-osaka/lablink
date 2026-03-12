import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import authConfig from "./auth.config";
import { getFirestoreAdmin } from "@/firebase/admin";
import { encryptToken } from "@/lib/encryption";
import type { Adapter } from "next-auth/adapters";

const firestoreAdapter = FirestoreAdapter(getFirestoreAdmin()) as Adapter;

const customAdapter: Adapter = {
    ...firestoreAdapter,
    async linkAccount(account) {
        // 必要に応じて access_token や refresh_token を暗号化
        const modifiedAccount = { ...account };

        if (modifiedAccount.access_token) {
            modifiedAccount.access_token = encryptToken(
                modifiedAccount.access_token,
            );
        }
        if (modifiedAccount.refresh_token) {
            modifiedAccount.refresh_token = encryptToken(
                modifiedAccount.refresh_token,
            );
        }

        // オリジナルの linkAccount に委譲
        if (firestoreAdapter.linkAccount) {
            const result = await firestoreAdapter.linkAccount(modifiedAccount);
            return result === undefined ? null : result;
        }
        return modifiedAccount;
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: customAdapter,
    session: {
        // middleware でのアクセスを可能にするため JWT を利用しつつ、
        // アダプター経由で Account 等を FIrestore に保存するハイブリッド構成
        strategy: "jwt",
    },
    ...authConfig,
    pages: {
        signIn: "/login",
    },
});
