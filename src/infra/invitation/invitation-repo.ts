import { Invitation, InvitationRepository } from "@/domain/invitation";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { getFirestoreAdmin } from "@/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { handleAdminError } from "@/infra/error-admin";
import { NotFoundError } from "@/domain/error";

const db = getFirestoreAdmin();
const invitationsRef = db.collection("invitations");
const invitationRef = (id: string) => invitationsRef.doc(id);

const toInvitationData = (invitation: Invitation) => {
    return {
        groupId: invitation.groupId,
        token: invitation.token,
        createdAt: Timestamp.fromDate(invitation.createdAt),
        expiresAt: Timestamp.fromDate(invitation.expiresAt),
        ...(invitation.usedAt && {
            usedAt: Timestamp.fromDate(invitation.usedAt),
        }),
        ...(invitation.usedBy && { usedBy: invitation.usedBy }),
    };
};

const fromInvitationDoc = (
    doc: FirebaseFirestore.QueryDocumentSnapshot,
): Invitation => {
    const data = doc.data();
    return {
        id: doc.id,
        groupId: data.groupId,
        token: data.token,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
        usedAt: data.usedAt ? data.usedAt.toDate() : undefined,
        usedBy: data.usedBy,
    };
};

export const invitationRepo: InvitationRepository = {
    create: (invitation) =>
        ResultAsync.fromPromise(
            invitationRef(invitation.id).set(toInvitationData(invitation)),
            handleAdminError,
        ).map(() => invitation),
    findByToken: (token) =>
        ResultAsync.fromPromise(
            invitationsRef.where("token", "==", token).get(),
            handleAdminError,
        )
            .map((snapshot) => snapshot.docs.at(0))
            .andThen((doc) =>
                doc === undefined
                    ? errAsync(NotFoundError("Invitation not found"))
                    : okAsync(fromInvitationDoc(doc)),
            ),
    delete: (invitationId) =>
        ResultAsync.fromPromise(
            invitationRef(invitationId).delete(),
            handleAdminError,
        ).map(() => undefined),
    acceptInvitationTransaction: (invitationId, userId, groupId) =>
        ResultAsync.fromPromise(
            db.runTransaction(async (transaction) => {
                // 1. 招待ドキュメントを取得
                const invitationDocRef = invitationRef(invitationId);
                const invitationSnap = await transaction.get(invitationDocRef);

                if (!invitationSnap.exists) {
                    throw new Error("招待が見つかりません");
                }

                const invitationData = invitationSnap.data();
                if (!invitationData) {
                    throw new Error("招待が見つかりません");
                }

                // 2. 使用済みチェック（トランザクション内で原子性保証）
                if (invitationData.usedAt) {
                    throw new Error("この招待リンクは既に使用されています");
                }

                // 3. グループドキュメントを取得（users/{userId}/groups/{groupId} のインデックス作成用）
                const groupDocRef = db.collection("groups").doc(groupId);
                const groupSnap = await transaction.get(groupDocRef);

                if (!groupSnap.exists) {
                    throw new Error("グループが見つかりません");
                }

                const groupData = groupSnap.data();
                if (!groupData) {
                    throw new Error("グループが見つかりません");
                }

                // 4. 招待を使用済みにマーク
                transaction.update(invitationDocRef, {
                    usedAt: FieldValue.serverTimestamp(),
                    usedBy: userId,
                });

                // 5. グループにメンバー追加 (groups/{groupId}/users/{userId})
                // 既存メンバーシップがあるかチェック（管理者の降格を防止）
                const groupUserRef = db
                    .collection("groups")
                    .doc(groupId)
                    .collection("users")
                    .doc(userId);
                const groupUserSnap = await transaction.get(groupUserRef);

                if (!groupUserSnap.exists) {
                    // 新規メンバーの場合のみ追加
                    transaction.set(groupUserRef, {
                        role: "member",
                        joinedAt: FieldValue.serverTimestamp(),
                    });
                }
                // 既に存在する場合は何もしない（既存の role を保持）

                // 6. ユーザーのグループ一覧に追加 (users/{userId}/groups/{groupId})
                // 既存メンバーシップがあるかチェック
                const userGroupRef = db
                    .collection("users")
                    .doc(userId)
                    .collection("groups")
                    .doc(groupId);
                const userGroupSnap = await transaction.get(userGroupRef);

                if (!userGroupSnap.exists) {
                    // 新規メンバーの場合のみ追加
                    // 既存の addMember と同じ形式で書き込む（groupConverter で読み取れる形式）
                    const userGroupIndexData = {
                        ...groupData,
                        createdAt:
                            groupData.createdAt instanceof Date
                                ? Timestamp.fromDate(groupData.createdAt)
                                : groupData.createdAt,
                        updatedAt:
                            groupData.updatedAt instanceof Date
                                ? Timestamp.fromDate(groupData.updatedAt)
                                : groupData.updatedAt,
                        joinedAt: FieldValue.serverTimestamp(),
                    };
                    transaction.set(userGroupRef, userGroupIndexData);
                }
                // 既に存在する場合は何もしない（既存の role を保持）
            }),
            handleAdminError,
        ).map(() => undefined),
};
