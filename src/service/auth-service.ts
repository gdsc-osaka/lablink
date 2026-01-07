import { ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";
import { createNewUser, User, UserRepository } from "@/domain/user";
import { AuthError, AuthRepository } from "@/domain/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authAdmin } from "@/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface AuthService {
    signInWithGoogle(): ResultAsync<User, DBError | AuthError>;
    createAuthSession(idToken: string): Promise<void>;
    requireAuth(): Promise<DecodedIdToken>;
    removeAuthSession(): Promise<void>;
}

export const createAuthService = (
    userRepository: UserRepository,
    authRepository: AuthRepository,
): AuthService => ({
    signInWithGoogle: () =>
        authRepository
            .signInWithGoogle()
            .andThen(createNewUser)
            .andThen(userRepository.create),

    async createAuthSession(idToken: string) {
        // 14日間有効なセッションクッキーを作成
        const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14日間（ミリ秒）

        try {
            const sessionCookie = await authAdmin.createSessionCookie(
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
                maxAge: expiresIn / 1000, // 秒に変換
            });
        } catch (error) {
            throw new Error("Failed to create session");
        }
    },

    async requireAuth(): Promise<DecodedIdToken> {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
            redirect("/login");
        }

        try {
            // セッションクッキーを検証（checkRevoked: true で無効化されたトークンを拒否）
            const decodedClaims = await authAdmin.verifySessionCookie(
                sessionCookie,
                true,
            );
            return decodedClaims;
        } catch (error) {
            redirect("/login");
        }
    },

    async removeAuthSession() {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        // セッションを無効化（リフレッシュトークンを取り消し）
        if (sessionCookie) {
            try {
                const decodedClaims =
                    await authAdmin.verifySessionCookie(sessionCookie);
                await authAdmin.revokeRefreshTokens(decodedClaims.sub);
            } catch (error) {
                // エラーは無視（既に無効なセッションの可能性）
            }
        }

        cookieStore.delete("session");
    },
});


