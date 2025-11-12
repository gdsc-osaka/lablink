import { doc, getDoc, setDoc } from "firebase/firestore";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { UserRepository } from "@/domain/user";
import { NotFoundError } from "@/domain/error";
import { db } from "@/firebase/client";
import { userConverter } from "@/infra/user/user-converter";
import { handleFirestoreError } from "@/infra/error";

const userRef = (id: string) =>
    doc(db, "users", id).withConverter(userConverter);

export const userRepo: UserRepository = {
    create: (user) =>
        ResultAsync.fromPromise(
            setDoc(userRef(user.email), user),
            handleFirestoreError,
        ).map(() => user),
    findById: (uid) =>
        ResultAsync.fromPromise(
            getDoc(userRef(uid)),
            handleFirestoreError,
        ).andThen((snapshot) =>
            snapshot.exists()
                ? okAsync(snapshot.data()!)
                : errAsync(NotFoundError("User not found")),
        ),
    update: (user) =>
        ResultAsync.fromPromise(
            setDoc(userRef(user.email), user, { merge: true }),
            handleFirestoreError,
        ).map(() => user),
};
