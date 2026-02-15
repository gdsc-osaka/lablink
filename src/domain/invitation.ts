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
    create(invitation: Invitation): ResultAsync<Invitation, DBError>;
    findByToken(token: string): ResultAsync<Invitation, DBError>;
    decline(token: string): ResultAsync<void, DBError>;
    delete(invitationId: string): ResultAsync<void, DBError>;
    acceptInvitationTransaction(
        invitationId: string,
        userId: string,
        groupId: string,
    ): ResultAsync<void, DBError>;
}
