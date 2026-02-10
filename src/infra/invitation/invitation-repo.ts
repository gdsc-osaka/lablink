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
    Timestamp,
} from "firebase/firestore";
import { invitationConverter } from "@/infra/invitation/invitation-converter";
import { groupConverter } from "@/infra/group/group-converter";
import { handleFirestoreError } from "@/infra/error";
import { NotFoundError } from "@/domain/error";
import type { UserGroupIndexData } from "@/infra/group/group-repo";

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

                // 3. グループドキュメントを取得（users/{userId}/groups/{groupId} のインデックス作成用）
                const groupDocRef = doc(db, "groups", groupId).withConverter(
                    groupConverter,
                );
                const groupSnap = await transaction.get(groupDocRef);

                if (!groupSnap.exists()) {
                    throw new Error("グループが見つかりません");
                }

                const groupData = groupSnap.data();

                // 4. 招待を使用済みにマーク
                transaction.update(invitationDocRef, {
                    usedAt: serverTimestamp(),
                    usedBy: userId,
                });

                // 5. グループにメンバー追加 (groups/{groupId}/users/{userId})
                // 既存メンバーシップがあるかチェック（管理者の降格を防止）
                const groupUserRef = doc(db, `groups/${groupId}/users`, userId);
                const groupUserSnap = await transaction.get(groupUserRef);

                if (!groupUserSnap.exists()) {
                    // 新規メンバーの場合のみ追加
                    transaction.set(groupUserRef, {
                        userId,
                        role: "member",
                        joinedAt: serverTimestamp(),
                    });
                }
                // 既に存在する場合は何もしない（既存の role を保持）

                // 6. ユーザーのグループ一覧に追加 (users/{userId}/groups/{groupId})
                // 既存メンバーシップがあるかチェック
                const userGroupRef = doc(db, `users/${userId}/groups`, groupId);
                const userGroupSnap = await transaction.get(userGroupRef);

                if (!userGroupSnap.exists()) {
                    // 新規メンバーの場合のみ追加
                    // 既存の addMember と同じ形式で書き込む（groupConverter で読み取れる形式）
                    const userGroupIndexData: UserGroupIndexData = {
                        ...groupData,
                        createdAt: Timestamp.fromDate(groupData.createdAt),
                        updatedAt: Timestamp.fromDate(groupData.updatedAt),
                        joinedAt: serverTimestamp(),
                    };
                    transaction.set(userGroupRef, userGroupIndexData);
                }
                // 既に存在する場合は何もしない（既存の role を保持）
            }),
            handleFirestoreError,
        ).map(() => undefined),
};
