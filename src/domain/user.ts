import { Timestamp } from "firebase/firestore";
import { ResultAsync } from "neverthrow";
import { DBError } from "@/domain/error";

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
