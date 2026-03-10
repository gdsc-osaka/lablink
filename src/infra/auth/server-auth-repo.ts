import "server-only";
import { google } from "googleapis";
import { GoogleTokenResponse, ServerAuthRepository } from "@/domain/auth";

/**
 * サーバーサイド専用: Google OAuth authorization code → token 交換
 * googleapis の OAuth2Client を使用することで、エンドポイント URL のハードコードを避ける
 */
export const createServerAuthRepo = (
    clientId: string,
    clientSecret: string,
): ServerAuthRepository => ({
    async exchangeAuthCode(
        code: string,
        redirectUri: string,
    ): Promise<GoogleTokenResponse> {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri,
        );
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.id_token) {
            throw new Error("必要なトークン情報がレスポンスに含まれていません");
        }

        // Credentials 型は expiry_date（Unix ms）を持つため、expires_in（秒）に変換する
        const expiresIn = tokens.expiry_date
            ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
            : 3600; // フォールバック: 1時間

        return {
            access_token: tokens.access_token,
            id_token: tokens.id_token,
            expires_in: expiresIn,
            refresh_token: tokens.refresh_token ?? undefined,
        };
    },
});
