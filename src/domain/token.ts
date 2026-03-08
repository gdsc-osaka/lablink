import { Result, ResultAsync } from "neverthrow";
import { errorBuilder, InferError } from "obj-err";
import {
    decryptToken as decrypt,
    encryptToken as encrypt,
} from "@/lib/encryption";
import * as z from "zod";

export const supportedExternalServices = ["google"] as const;
export type ExternalServiceType = (typeof supportedExternalServices)[number];

export interface Token {
    userId: string;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    serviceType: ExternalServiceType;
}

export interface EncryptedToken extends Omit<Token, "token"> {
    encryptedToken: string;
}

export const TokenNotFoundError = errorBuilder(
    "TokenNotFoundError",
    z.object({
        impl: z.string(),
        userId: z.string(),
        serviceType: z.string(),
    }),
);
export type TokenNotFoundError = InferError<typeof TokenNotFoundError>;

export const TokenEncryptionError = errorBuilder(
    "TokenEncryptionError",
    z.object({
        impl: z.string(),
        userId: z.string(),
        serviceType: z.string(),
    }),
);
export type TokenEncryptionError = InferError<typeof TokenEncryptionError>;

export const TokenDecryptionError = errorBuilder(
    "TokenDecryptionError",
    z.object({
        impl: z.string(),
        userId: z.string(),
        serviceType: z.string(),
    }),
);
export type TokenDecryptionError = InferError<typeof TokenDecryptionError>;

export const TokenUnknownError = errorBuilder(
    "TokenUnknownError",
    z.object({
        impl: z.string(),
        userId: z.string().optional(),
        serviceType: z.string().optional(),
    }),
);
export type TokenUnknownError = InferError<typeof TokenUnknownError>;

export type TokenError =
    | TokenNotFoundError
    | TokenEncryptionError
    | TokenDecryptionError
    | TokenUnknownError;

export const decryptToken = (
    encryptedToken: EncryptedToken,
): Result<Token, TokenDecryptionError> => {
    return Result.fromThrowable(decrypt, (error) => {
        if (error instanceof Error) {
            return TokenDecryptionError(error.message, {
                extra: {
                    impl: encryptedToken.serviceType,
                    userId: encryptedToken.userId,
                    serviceType: encryptedToken.serviceType,
                },
            });
        }

        return TokenDecryptionError(String(error), {
            extra: {
                impl: encryptedToken.serviceType,
                userId: encryptedToken.userId,
                serviceType: encryptedToken.serviceType,
            },
        });
    })(encryptedToken.encryptedToken).map((decryptedToken) => ({
        ...encryptedToken,
        token: decryptedToken,
    }));
};

export const encryptToken = (
    token: Token,
): Result<EncryptedToken, TokenEncryptionError> => {
    return Result.fromThrowable(decrypt, (error) => {
        if (error instanceof Error) {
            return TokenEncryptionError(error.message, {
                extra: {
                    impl: token.serviceType,
                    userId: token.userId,
                    serviceType: token.serviceType,
                },
            });
        }

        return TokenEncryptionError(String(error), {
            extra: {
                impl: token.serviceType,
                userId: token.userId,
                serviceType: token.serviceType,
            },
        });
    })(token.token).map((encryptedToken) => ({
        ...token,
        encryptedToken: encryptedToken,
    }));
};

export interface TokenRepository {
    add(
        token: Omit<EncryptedToken, "createdAt" | "updatedAt">,
    ): ResultAsync<EncryptedToken, TokenError>;
    update(
        token: Omit<EncryptedToken, "updatedAt">,
    ): ResultAsync<EncryptedToken, TokenError>;
    get(
        userId: string,
        serviceType: ExternalServiceType,
    ): ResultAsync<EncryptedToken, TokenError>;
}
