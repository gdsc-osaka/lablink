import { Timestamp } from "firebase/firestore";
import { ok, Result, ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";
import { User as AuthUser } from "firebase/auth";

export interface User {
    email: string;
    created_at: Timestamp;
    updated_at: Timestamp;
    // Google OAuth トークン管理
    google_refresh_token_encrypted?: string;
    google_token_expires_at?: Timestamp;
}

export interface UserRepository {
    create(user: User): ResultAsync<User, DBError>;
    findById(uid: string): ResultAsync<User, DBError>;
    update(user: User): ResultAsync<User, DBError>;
}

export const createNewUser = (user: AuthUser): Result<User, never> => {
    const timestamp = Timestamp.now();
    return ok({
        email: user.email!,
        created_at: timestamp,
        updated_at: timestamp,
    });
};
