import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
    providers: [
        Google({
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        // middlewareやclient側で必要なユーザー情報を拡充
        jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
            }
            if (account) {
                // 必要に応じて accessToken 等を持たせることも可能ですが、
                // リフレッシュトークンはFirestoreに保存されるため不要です。
            }
            return token;
        },
        session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    // pages: {
    //     signIn: "/login",
    // },
} satisfies NextAuthConfig;
