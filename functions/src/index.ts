import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Firebase Admin SDKを初期化
admin.initializeApp();

const db = admin.firestore();

/**
 * groups/:groupId/users/:userId が削除された時のトリガー
 * 以下の処理を実行：
 * 1. users/:userId/groups/:groupId を削除
 * 2. groups/:groupId/deleted_users/:userId にアーカイブ
 */
export const onGroupUserDeleted = functions.firestore
  .document("groups/{groupId}/users/{userId}")
  .onDelete(async (snap, context) => {
    const { groupId, userId } = context.params;
    const deletedUserData = snap.data();

    try {
      const batch = db.batch();

      // 1. users/:userId/groups/:groupId を削除
      const userGroupRef = db
        .collection("users")
        .doc(userId)
        .collection("groups")
        .doc(groupId);
      batch.delete(userGroupRef);

      // 2. groups/:groupId/deleted_users/:userId にアーカイブ
      const deletedUsersRef = db
        .collection("groups")
        .doc(groupId)
        .collection("deleted_users")
        .doc(userId);

      batch.set(deletedUsersRef, {
        ...deletedUserData,
        role: deletedUserData.role,
        joinedAt: deletedUserData.joinedAt,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // バッチ処理を実行
      await batch.commit();

      functions.logger.info(
        `User ${userId} successfully removed from group ${groupId} and archived.`,
      );
    } catch (error) {
      functions.logger.error(
        `Error processing group user deletion for userId: ${userId}, groupId: ${groupId}`,
        error,
      );
      throw error;
    }
  });
