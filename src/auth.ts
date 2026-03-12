import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import authConfig from "./auth.config";
import { getFirestoreAdmin } from "@/firebase/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: FirestoreAdapter(getFirestoreAdmin()),
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
