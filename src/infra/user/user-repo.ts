import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { UserRepository } from "@/domain/user";
import { NotFoundError } from "@/domain/error";
import { db } from "@/firebase/client";
import { userConverter } from "@/infra/user/user-converter";
import { handleFirestoreError } from "@/infra/error";

const userRef = (id: string) =>
    doc(db, "users", id).withConverter(userConverter);

export const userRepo: UserRepository = {
    saveUser: (user) =>
        ResultAsync.fromPromise(
            runTransaction(db, async (transaction) => {
                const docRef = userRef(user.uid);
                const snapshot = await transaction.get(docRef);

                if (snapshot.exists()) {
                    transaction.update(doc(db, "users", user.uid), {
                        email: user.email,
                        updated_at: serverTimestamp(),
                    });
                } else {
                    transaction.set(doc(db, "users", user.uid), {
                        email: user.email,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                    });
                }
            }),
            handleFirestoreError,
        ).map(() => user),
    getUserByUid: (uid) =>
        ResultAsync.fromPromise(
            getDoc(userRef(uid)),
            handleFirestoreError,
        ).andThen((snapshot) =>
            snapshot.exists()
                ? okAsync(snapshot.data()!)
                : errAsync(NotFoundError("User not found")),
        ),
};
