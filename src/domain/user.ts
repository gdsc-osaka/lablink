import { Timestamp } from "firebase/firestore";
import { ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";
import { User as AuthUser } from "firebase/auth";

export interface User {
    email: string;
    created_at: Timestamp;
    updated_at: Timestamp;
}

export interface UserRepository {
    create(user: User): ResultAsync<User, DBError>;
    findById(uid: string): ResultAsync<User, DBError>;
    update(user: User): ResultAsync<User, DBError>;
}

export const createNewUser = (user: AuthUser): User => {
    const timestamp = Timestamp.now();
    return {
        email: user.email!,
        created_at: timestamp,
        updated_at: timestamp,
    };
}
