import { ResultAsync } from "neverthrow";
import { errorBuilder, InferError } from "obj-err";
import * as z from "zod";

export const OAuthUnknownError = errorBuilder(
    "OAuthUnknownError",
    z.object({
        provider: z.string(),
    }),
);

export type OAuthUnknownError = InferError<typeof OAuthUnknownError>;

export type OAuthError = OAuthUnknownError;

export interface OAuthTokenResponse {
    accessToken: string;
    idToken?: string;
    expiresIn: number;
    refreshToken?: string;
}

export interface OAuthRepository {
    exchangeAuthCode(
        code: string,
        redirectUri: string,
    ): ResultAsync<OAuthTokenResponse, OAuthError>;
}
