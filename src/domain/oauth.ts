/**
 * Google OAuth 関連の型定義
 */

/**
 * Google OAuth トークンレスポンス
 * https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
 */
export interface GoogleOAuthTokens {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
    id_token?: string;
}

/**
 * トークン交換APIのレスポンス
 */
export interface TokenExchangeResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    refresh_token?: string;
}

/**
 * リフレッシュトークンのメタデータ
 * Firestore に保存される情報
 */
export interface RefreshTokenData {
    encrypted_token: string;
    created_at: Date;
    updated_at: Date;
    scope: string;
    expires_at?: Date;
}

/**
 * アクセストークン生成リクエスト
 */
export interface AccessTokenRequest {
    refresh_token: string;
    client_id: string;
    client_secret: string;
    grant_type: "refresh_token";
}

/**
 * アクセストークン生成レスポンス
 */
export interface AccessTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}
