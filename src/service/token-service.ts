import {
    decryptToken,
    EncryptedToken,
    encryptToken,
    ExternalServiceType,
    TokenError,
    TokenRepository,
} from "@/domain/token";
import { ResultAsync } from "neverthrow";

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
        tokenRepository.add(encryptToken(token as Token)).map(decryptToken),
    updateToken: (token) =>
        tokenRepository.update(encryptToken(token as Token)).map(decryptToken),
    getSavedToken: (userId, serviceType) =>
        tokenRepository.get(userId, serviceType).map(decryptToken),
});
