/** Google OAuth トークン交換レスポンス */
export interface GoogleTokenResponse {
    access_token: string;
    id_token: string;
    expires_in: number;
    refresh_token?: string;
}

/** サーバーサイド専用: OAuth authorization code → token 交換 */
export interface ServerAuthRepository {
    exchangeAuthCode(
        code: string,
        redirectUri: string,
    ): Promise<GoogleTokenResponse>;
}
