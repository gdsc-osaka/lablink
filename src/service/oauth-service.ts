import { ResultAsync } from "neverthrow";
import {
    OAuthError,
    OAuthRepository,
    OAuthTokenResponse,
} from "@/domain/oauth";

export interface OAuthService {
    exchangeAuthCode(
        code: string,
        redirectUri: string,
    ): ResultAsync<OAuthTokenResponse, OAuthError>;
}

export const createOAuthService = (
    oauthRepository: OAuthRepository,
): OAuthService => ({
    exchangeAuthCode: (code, redirectUri) =>
        oauthRepository.exchangeAuthCode(code, redirectUri),
});
