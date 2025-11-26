import {AuthRepository} from "@/domain/auth";
import {ResultAsync} from "neverthrow";
import {AuthError, GoogleAuthProvider, signInWithPopup, signInWithRedirect, User} from "firebase/auth";
import {auth} from "@/firebase/client";

export const authRepo: AuthRepository = {
    signInWithGoogle(): ResultAsync<User, AuthError> {
        const provider = new GoogleAuthProvider();

        return ResultAsync.fromPromise(
            signInWithPopup(auth, provider).then((result) => result.user),
            (e) => e as AuthError,
        );
    },
};
