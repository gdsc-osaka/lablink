import { getFirestoreAdmin } from "@/firebase/admin";
import { User, UserRepository } from "@/domain/user";
import { DBError, NotFoundError } from "@/domain/error";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { handleAdminError } from "@/infra/error-admin";
import { Timestamp } from "firebase-admin/firestore";

const db = getFirestoreAdmin();

const toUser = (uid: string, data: FirebaseFirestore.DocumentData): User => {
    return {
        uid,
        email: data.email || "Unknown Email",
        created_at: data.created_at?.toDate() ?? new Date(),
        updated_at: data.updated_at?.toDate() ?? new Date(),
    };
};

export const userAdminRepo: UserRepository = {
    saveUser: (user) => {
        const docRef = db.collection("users").doc(user.uid);
        return ResultAsync.fromPromise(
            docRef.set(
                {
                    email: user.email,
                    created_at: Timestamp.fromDate(user.created_at),
                    updated_at: Timestamp.fromDate(user.updated_at),
                },
                { merge: true },
            ),
            handleAdminError,
        ).map(() => user);
    },

    getUserByUid: (uid) => {
        const docRef = db.collection("users").doc(uid);
        return ResultAsync.fromPromise(docRef.get(), handleAdminError).andThen(
            (snapshot) =>
                snapshot.exists
                    ? okAsync(toUser(uid, snapshot.data()!))
                    : errAsync(NotFoundError("User not found")),
        );
    },
};

// 複数ユーザーを一度に取得する補助関数
export const findUsersByIds = (
    userIds: string[],
): ResultAsync<Map<string, User>, DBError> => {
    if (userIds.length === 0) {
        return okAsync(new Map());
    }

    const results = userIds.map((uid) =>
        userAdminRepo
            .getUserByUid(uid)
            .map((user) => ({ uid, user }))
            .orElse((error) => {
                // NotFoundは想定内なのでnull（成功）として扱う
                if (error.message.includes("not found")) {
                    return okAsync(null);
                }
                // それ以外のエラーはそのまま伝播させる
                return errAsync(error);
            }),
    );

    return ResultAsync.combine(results).map((combinedResults) => {
        const userMap = new Map<string, User>();
        combinedResults.forEach((result) => {
            if (result && result.user) {
                userMap.set(result.uid, result.user);
            }
        });
        return userMap;
    });
};
