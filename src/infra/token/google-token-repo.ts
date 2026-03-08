import "server-only";

import {
    TokenNotFoundError,
    TokenRepository,
    TokenUnknownError,
} from "@/domain/token";
import { getFirestoreAdmin } from "@/firebase/admin";
import { tokenConverter } from "./google-token-converter";
import { err, ok, ResultAsync } from "neverthrow";
import { FirebaseFirestoreError } from "firebase-admin/firestore";

const GOOGLE_TOKEN_IMPL = "google-token";

const dbAdmin = getFirestoreAdmin();

const tokenCollection = (userId: string) =>
    dbAdmin
        .collection("users")
        .doc(userId)
        .collection("tokens")
        .withConverter(tokenConverter);

export const googleTokenRepository: TokenRepository = {
    upsert: (token) =>
        ResultAsync.fromPromise(
            tokenCollection(token.userId).doc(token.serviceType).set({
                userId: token.userId,
                encryptedToken: token.encryptedToken,
                serviceType: token.serviceType,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: token.expiresAt,
            }),
            (error) => {
                const _error = error as FirebaseFirestoreError;
                return TokenUnknownError(_error.message, {
                    extra: {
                        impl: GOOGLE_TOKEN_IMPL,
                        userId: token.userId,
                        serviceType: token.serviceType,
                    },
                });
            },
        ).map((writeResult) => {
            return {
                userId: token.userId,
                encryptedToken: token.encryptedToken,
                serviceType: token.serviceType,
                createdAt: writeResult.writeTime.toDate(),
                updatedAt: writeResult.writeTime.toDate(),
                expiresAt: token.expiresAt,
            };
        }),

    update: (token) =>
        ResultAsync.fromPromise(
            tokenCollection(token.userId).doc(token.serviceType).set({
                userId: token.userId,
                encryptedToken: token.encryptedToken,
                serviceType: token.serviceType,
                createdAt: token.createdAt,
                updatedAt: new Date(),
                expiresAt: token.expiresAt,
            }),
            (error) => {
                const _error = error as FirebaseFirestoreError;
                return TokenUnknownError(_error.message, {
                    extra: {
                        impl: GOOGLE_TOKEN_IMPL,
                        userId: token.userId,
                        serviceType: token.serviceType,
                    },
                });
            },
        ).map((writeResult) => {
            return {
                userId: token.userId,
                encryptedToken: token.encryptedToken,
                serviceType: token.serviceType,
                createdAt: token.createdAt,
                updatedAt: writeResult.writeTime.toDate(),
                expiresAt: token.expiresAt,
            };
        }),

    get: (userId, serviceType) => {
        return ResultAsync.fromPromise(
            tokenCollection(userId).doc(serviceType).get(),
            (error) => {
                const _error = error as FirebaseFirestoreError;
                return TokenUnknownError(_error.message, {
                    extra: {
                        impl: GOOGLE_TOKEN_IMPL,
                        userId,
                        serviceType,
                    },
                });
            },
        ).andThen((snapshot) => {
            const token = snapshot.data();
            if (!snapshot.exists || !token) {
                return err(
                    TokenNotFoundError("Token not found", {
                        extra: {
                            impl: GOOGLE_TOKEN_IMPL,
                            userId,
                            serviceType,
                        },
                    }),
                );
            }
            return ok(token);
        });
    },
};
