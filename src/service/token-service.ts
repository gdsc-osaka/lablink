import {
    decryptToken,
    EncryptedToken,
    encryptToken,
    ExternalServiceType,
    TokenError,
    TokenRepository,
} from "@/domain/token";
import { Result, ResultAsync } from "neverthrow";

export interface Token extends Omit<EncryptedToken, "encryptedToken"> {
    token: string;
}

export interface TokenService {
    saveToken: (
        token: Omit<Token, "createdAt" | "updatedAt">,
    ) => ResultAsync<Token, TokenError>;
    updateToken: (
        token: Omit<Token, "updatedAt">,
    ) => ResultAsync<Token, TokenError>;
    getSavedToken: (
        userId: string,
        serviceType: ExternalServiceType,
    ) => ResultAsync<Token, TokenError>;
}

export const createTokenService = (
    tokenRepository: TokenRepository,
): TokenService => ({
    saveToken: (token) => {
        const now = new Date();
        const fullToken: Token = { ...token, createdAt: now, updatedAt: now };
        return encryptToken(fullToken)
            .asyncAndThen(tokenRepository.set)
            .andThen(decryptToken);
    },
    updateToken: (token) => {
        const fullToken: Token = { ...token, updatedAt: new Date() };
        return encryptToken(fullToken)
            .asyncAndThen(tokenRepository.set)
            .andThen(decryptToken);
    },
    getSavedToken: (userId, serviceType) =>
        tokenRepository.get(userId, serviceType).andThen(decryptToken),
});
