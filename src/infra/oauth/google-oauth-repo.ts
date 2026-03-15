import "server-only";

import { google } from "googleapis";
import { ResultAsync } from "neverthrow";
import {
    OAuthRepository,
    OAuthTokenResponse,
    OAuthUnknownError,
    OAuthError,
} from "@/domain/oauth";

/**
 * サーバーサイド専用: Google OAuth authorization code → token 交換
 * googleapis の OAuth2Client を使用することで、エンドポイント URL のハードコードを避ける
 */
export const createGoogleOAuthRepo = (
    clientId: string,
    clientSecret: string,
): OAuthRepository => ({
    exchangeAuthCode: (
        code: string,
        redirectUri: string,
    ): ResultAsync<OAuthTokenResponse, OAuthError> =>
        ResultAsync.fromPromise(
            (async () => {
                const oauth2Client = new google.auth.OAuth2(
                    clientId,
                    clientSecret,
                    redirectUri,
                );
                const { tokens } = await oauth2Client.getToken(code);

                if (!tokens.access_token) {
                    throw new Error(
                        "必要なトークン情報がレスポンスに含まれていません",
                    );
                }

                // Credentials 型は expiry_date（Unix ms）を持つため、expires_in（秒）に変換する
                const expiresIn = Math.max(
                    0,
                    tokens.expiry_date
                        ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
                        : 3600, // フォールバック: 1時間
                );

                return {
                    accessToken: tokens.access_token,
                    idToken: tokens.id_token ?? undefined,
                    expiresIn,
                    refreshToken: tokens.refresh_token ?? undefined,
                };
            })(),
            (error) => {
                const message =
                    error instanceof Error ? error.message : String(error);
                return OAuthUnknownError(message, {
                    extra: {
                        provider: "google",
                    },
                });
            },
        ),
});
