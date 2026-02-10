import { InvitationRepository } from "@/domain/invitation";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { db } from "@/firebase/client";
import {
    collection,
    doc,
    getDocs,
    query,
    setDoc,
    where,
    deleteDoc,
    serverTimestamp,
    runTransaction,
} from "firebase/firestore";
import { invitationConverter } from "@/infra/invitation/invitation-converter";
import { handleFirestoreError } from "@/infra/error";
import { NotFoundError } from "@/domain/error";

const invitationsRef = collection(db, "invitations").withConverter(
    invitationConverter,
);
const invitationRef = (id: string) =>
    doc(db, "invitations", id).withConverter(invitationConverter);

export const invitationRepo: InvitationRepository = {
    create: (invitation) =>
        ResultAsync.fromPromise(
            setDoc(invitationRef(invitation.id), invitation),
            handleFirestoreError,
        ).map(() => invitation),
    findByToken: (token) =>
        ResultAsync.fromPromise(
            getDocs(query(invitationsRef, where("token", "==", token))),
            handleFirestoreError,
        )
            .map((snapshot) => snapshot.docs.map((doc) => doc.data()).at(0))
            .andThen((data) =>
                data === undefined
                    ? errAsync(NotFoundError("Invitation not found"))
                    : okAsync(data),
            ),
    delete: (invitationId) =>
        ResultAsync.fromPromise(
            deleteDoc(invitationRef(invitationId)),
            handleFirestoreError,
        ).map(() => undefined),
    acceptInvitationTransaction: (invitationId, userId, groupId) =>
        ResultAsync.fromPromise(
            runTransaction(db, async (transaction) => {
                // 1. 招待ドキュメントを取得
                const invitationDocRef = doc(db, "invitations", invitationId);
                const invitationSnap = await transaction.get(invitationDocRef);

                if (!invitationSnap.exists()) {
                    throw new Error("招待が見つかりません");
                }

                const invitationData = invitationSnap.data();

                // 2. 使用済みチェック（トランザクション内で原子性保証）
                if (invitationData.usedAt) {
                    throw new Error("この招待リンクは既に使用されています");
                }

                // 3. 招待を使用済みにマーク
                transaction.update(invitationDocRef, {
                    usedAt: serverTimestamp(),
                    usedBy: userId,
                });

                // 4. グループにメンバー追加 (groups/{groupId}/users/{userId})
                const groupUserRef = doc(db, `groups/${groupId}/users`, userId);
                transaction.set(groupUserRef, {
                    userId,
                    role: "member",
                    joinedAt: serverTimestamp(),
                });

                // 5. ユーザーのグループ一覧に追加 (users/{userId}/groups/{groupId})
                const userGroupRef = doc(db, `users/${userId}/groups`, groupId);
                transaction.set(userGroupRef, {
                    groupId,
                    role: "member",
                    joinedAt: serverTimestamp(),
                });
            }),
            handleFirestoreError,
        ).map(() => undefined),
};
