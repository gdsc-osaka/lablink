import {ResultAsync} from "neverthrow";
import {AuthError as FirebaseAuthError, User} from "firebase/auth";

export type AuthError = FirebaseAuthError;

export interface AuthRepository {
    signInWithGoogle(): ResultAsync<User, AuthError>
}