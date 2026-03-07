import { ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";

<<<<<<< HEAD
=======
export type InvitationStatus = "pending" | "accepted" | "declined";

>>>>>>> origin/main
export interface Invitation {
    id: string;
    groupId: string;
    token: string;
<<<<<<< HEAD
    createdAt: Date;
    expiresAt: Date;
=======
    status: InvitationStatus;
    createdAt: Date;
    expiresAt: Date;
    usedAt?: Date; // 招待が使用された日時
    usedBy?: string; // 招待を使用したユーザーID
>>>>>>> origin/main
}

export interface InvitationRepository {
    create(invitation: Invitation): ResultAsync<Invitation, DBError>;
    findByToken(token: string): ResultAsync<Invitation, DBError>;
<<<<<<< HEAD
=======
    decline(token: string): ResultAsync<void, DBError>;
    delete(invitationId: string): ResultAsync<void, DBError>;
    acceptInvitationTransaction(
        invitationId: string,
        userId: string,
        groupId: string,
    ): ResultAsync<void, DBError>;
>>>>>>> origin/main
}
