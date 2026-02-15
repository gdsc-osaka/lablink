import {
    Invitation,
    InvitationRepository,
    InvitationStatus,
} from "@/domain/invitation";
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
        status: invitation.status,
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
        status: (data.status as InvitationStatus) || "pending", // 既存データ用
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
    decline: (token) =>
        ResultAsync.fromPromise(
            invitationsRef.where("token", "==", token).get(),
            handleAdminError,
        )
            .map((snapshot) => snapshot.docs.at(0))
            .andThen((doc) => {
                if (!doc) return errAsync(NotFoundError("Invitation not found"));
                return ResultAsync.fromPromise(
                    doc.ref.update({ status: "declined" }),
                    handleAdminError,
                );
            })
            .map(() => undefined),
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

                // 2. 使用済み・ステータスチェック（トランザクション内で原子性保証）
                if (invitationData.status === "declined") {
                    throw new Error("この招待リンクは拒否されています");
                }
                if (invitationData.status === "accepted" || invitationData.usedAt) {
                    throw new Error("この招待リンクは既に使用されています");
                }

                // 3. グループドキュメントを取得
                const groupDocRef = db.collection("groups").doc(groupId);
                const groupSnap = await transaction.get(groupDocRef);

                if (!groupSnap.exists) {
                    throw new Error("グループが見つかりません");
                }

                const groupData = groupSnap.data() as {
                    createdAt: Timestamp | Date;
                    updatedAt: Timestamp | Date;
                    [key: string]: any;
                };
                if (!groupData) {
                    throw new Error("グループが見つかりません");
                }

                // 4. グループメンバーシップをチェック (groups/{groupId}/users/{userId})
                const groupUserRef = db
                    .collection("groups")
                    .doc(groupId)
                    .collection("users")
                    .doc(userId);
                const groupUserSnap = await transaction.get(groupUserRef);

                // 5. ユーザーのグループ一覧をチェック (users/{userId}/groups/{groupId})
                const userGroupRef = db
                    .collection("users")
                    .doc(userId)
                    .collection("groups")
                    .doc(groupId);
                const userGroupSnap = await transaction.get(userGroupRef);

                // 6. 招待を使用済みにマーク
                transaction.update(invitationDocRef, {
                    status: "accepted",
                    usedAt: FieldValue.serverTimestamp(),
                    usedBy: userId,
                });

                // 7. グループにメンバー追加（既存メンバーシップがない場合）
                if (!groupUserSnap.exists) {
                    transaction.set(groupUserRef, {
                        role: "member",
                        joinedAt: FieldValue.serverTimestamp(),
                    });
                }

                // 8. ユーザーのグループ一覧に追加（既存エントリがない場合）
                if (!userGroupSnap.exists) {
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
            }),
            handleAdminError,
        ).map(() => undefined),
};
