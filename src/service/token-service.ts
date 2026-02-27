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
    saveToken: (token) =>
        encryptToken(token as Token)
            .asyncAndThen(tokenRepository.add)
            .andThen(decryptToken),
    updateToken: (token) =>
        encryptToken(token as Token)
            .asyncAndThen(tokenRepository.update)
            .andThen(decryptToken),
    getSavedToken: (userId, serviceType) =>
        tokenRepository.get(userId, serviceType).andThen(decryptToken),
});
