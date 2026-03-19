import { ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";

export type InvitationStatus = "pending" | "accepted" | "declined";

export interface Invitation {
    id: string;
    groupId: string;
    token: string;
    status: InvitationStatus;
    createdAt: Date;
    expiresAt: Date;
    usedAt?: Date; // 招待が使用された日時
    usedBy?: string; // 招待を使用したユーザーID
}

export interface InvitationRepository {
    createInvitation(invitation: Invitation): ResultAsync<Invitation, DBError>;
    getInvitationByToken(token: string): ResultAsync<Invitation, DBError>;
    declineByToken(token: string): ResultAsync<void, DBError>;
    deleteInvitation(invitationId: string): ResultAsync<void, DBError>;
    acceptInvitation(
        invitationId: string,
        userId: string,
        groupId: string,
    ): ResultAsync<void, DBError>;
}
