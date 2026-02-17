import { getFirestoreAdmin } from "@/firebase/admin";
import { User, UserRepository } from "@/domain/user";
import { DBError, NotFoundError } from "@/domain/error";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { handleAdminError } from "@/infra/error-admin";
import { Timestamp } from "firebase-admin/firestore";

const db = getFirestoreAdmin();

const toUser = (data: FirebaseFirestore.DocumentData): User => {
    return {
        email: data.email,
        created_at: data.created_at,
        updated_at: data.updated_at,
    } as User;
};

export const userAdminRepo: UserRepository = {
    create: (user) => {
        const docRef = db.collection("users").doc(user.email);
        return ResultAsync.fromPromise(
            docRef.set({
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at,
            }),
            handleAdminError,
        ).map(() => user);
    },

    findById: (uid) => {
        const docRef = db.collection("users").doc(uid);
        return ResultAsync.fromPromise(docRef.get(), handleAdminError).andThen(
            (snapshot) =>
                snapshot.exists
                    ? okAsync(toUser(snapshot.data()!))
                    : errAsync(NotFoundError("User not found")),
        );
    },

    update: (user) => {
        const docRef = db.collection("users").doc(user.email);
        return ResultAsync.fromPromise(
            docRef.set(
                {
                    email: user.email,
                    updated_at: user.updated_at,
                },
                { merge: true },
            ),
            handleAdminError,
        ).map(() => user);
    },
};

// 複数ユーザーを一度に取得する補助関数
export const findUsersByIds = (
    userIds: string[],
): ResultAsync<Map<string, User>, DBError> => {
    if (userIds.length === 0) {
        return okAsync(new Map());
    }

    const promises = userIds.map((uid) =>
        userAdminRepo.findById(uid).match(
            (user) => ({ uid, user }),
            (error) => {
                // サービス層でビジネスコンテキストを含めてログ出力するため、ここではサイレント
                // ただし、NotFound以外のエラー（DB接続エラーなど）は握りつぶさずにthrowする
                if (!error.message.includes("not found")) {
                    throw error;
                }
                return null;
            },
        ),
    );

    // Note: match()はPromiseを返すため、Promise.allで待機する必要がある
    // ResultAsync.fromPromiseのAPI要件によりerror handlerの指定が必要
    return ResultAsync.fromPromise(Promise.all(promises), handleAdminError).map(
        (results) => {
            const userMap = new Map<string, User>();
            results.forEach((result) => {
                if (result && result.user) {
                    userMap.set(result.uid, result.user);
                }
            });
            return userMap;
        },
    );
};

