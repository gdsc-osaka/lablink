import { ResultAsync } from "neverthrow";
import { errorBuilder, InferError } from "obj-err";
import {
    decryptToken as decrypt,
    encryptToken as encrypt,
} from "@/lib/encryption";
import z from "zod";

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
    | TokenDecryptionError
    | TokenUnknownError;

export const decryptToken = (encryptedToken: EncryptedToken): Token => {
    return {
        ...encryptedToken,
        token: decrypt(encryptedToken.encryptedToken),
    };
};

export const encryptToken = (token: Token): EncryptedToken => {
    return {
        ...token,
        encryptedToken: encrypt(token.token),
    };
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
