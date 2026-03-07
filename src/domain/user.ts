<<<<<<< HEAD
import { Timestamp } from "firebase/firestore";
=======
>>>>>>> origin/main
import { ok, Result, ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";
import { User as AuthUser } from "firebase/auth";

export interface User {
<<<<<<< HEAD
    email: string;
    created_at: Timestamp;
    updated_at: Timestamp;
=======
    uid: string;
    email: string;
    created_at: Date;
    updated_at: Date;
>>>>>>> origin/main
}

export interface UserRepository {
    create(user: User): ResultAsync<User, DBError>;
    findById(uid: string): ResultAsync<User, DBError>;
    update(user: User): ResultAsync<User, DBError>;
}

export const createNewUser = (user: AuthUser): Result<User, never> => {
<<<<<<< HEAD
    const timestamp = Timestamp.now();
    return ok({
        email: user.email!,
        created_at: timestamp,
        updated_at: timestamp,
=======
    const now = new Date();
    return ok({
        uid: user.uid,
        email: user.email!,
        created_at: now,
        updated_at: now,
>>>>>>> origin/main
    });
};
