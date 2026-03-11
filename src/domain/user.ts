import { ok, Result, ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";
import { User as AuthUser } from "firebase/auth";

export interface User {
    uid: string;
    email: string;
    created_at: Date;
    updated_at: Date;
}

export interface UserRepository {
    create(user: User): ResultAsync<User, DBError>;
    findById(uid: string): ResultAsync<User, DBError>;
    update(user: User): ResultAsync<User, DBError>;
}

export const createNewUser = (user: AuthUser): Result<User, never> => {
    const now = new Date();
    return ok({
        uid: user.uid,
        email: user.email!,
        created_at: now,
        updated_at: now,
    });
};
