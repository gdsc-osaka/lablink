import { AuthRepository } from "@/domain/auth";
import { ResultAsync } from "neverthrow";
import {
    AuthError,
    GoogleAuthProvider,
    signInWithPopup,
    User,
} from "firebase/auth";
import { auth } from "@/firebase/client";

export const authRepo: AuthRepository = {
    signInWithGoogle(state?: string): ResultAsync<User, AuthError> {
        const provider = new GoogleAuthProvider();

        if (state) {
            provider.setCustomParameters({ state });
        }

        // Google Calendar APIのアクセス権をリクエスト
        provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

        return ResultAsync.fromPromise(
            signInWithPopup(auth, provider).then((result) => result.user),
            (e) => e as AuthError,
        );
    },
};
