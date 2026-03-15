import { ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";
import { createNewUser, User, UserRepository } from "@/domain/user";
import { AuthError, AuthRepository } from "@/domain/auth";

export interface AuthService {
    signInWithGoogle(state?: string): ResultAsync<User, DBError | AuthError>;
}

export const createAuthService = (
    userRepository: UserRepository,
    authRepository: AuthRepository,
): AuthService => ({
    signInWithGoogle: (state) =>
        authRepository
            .signInWithGoogle(state)
            .andThen(createNewUser)
            .andThen(userRepository.create),
});
