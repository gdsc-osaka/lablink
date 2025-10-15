import { ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";

export interface Invitation {
    id: string;
    groupId: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface InvitationRepository {
    create(invitation: Invitation): ResultAsync<Invitation, DBError>;
    findByToken(token: string): ResultAsync<Invitation, DBError>;
}
