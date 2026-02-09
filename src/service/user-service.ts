import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { DBError, ServiceError, ServiceLogicError } from "@/domain/error";
import { User, UserRepository } from "@/domain/user";
import { Timestamp } from "firebase/firestore";

export interface UpdateUserDto {
    name?: string;
}

export interface UserService {
    /* IDでユーザーを1人取得*/
    getUserById: (userId: string) => ResultAsync<User, ServiceError>;

    /*ユーザー情報を一括取得(メンバー一覧表示用)*/
    getUsersByIds: (userIds: string[]) => ResultAsync<User[], ServiceError>;

    /* ユーザー情報の更新(名前)*/
    updateUser: (
        userId: string,
        dto: UpdateUserDto,
    ) => ResultAsync<User, ServiceError>;
}

interface UserServiceDeps {
    userRepo: UserRepository;
}

const validateUserId = (userId: string): ResultAsync<void, ServiceError> => {
    if (!userId) {
        return errAsync(
            ServiceLogicError("ユーザーIDが必要です", {
                extra: { code: "MISSING_ID" },
            }),
        );
    }
    return okAsync(undefined);
};

export const createUserService = ({
    userRepo,
}: UserServiceDeps): UserService => ({
    getUserById: (userId) => {
        return validateUserId(userId).andThen(() => userRepo.findById(userId));
    },

    getUsersByIds: (userIds) => {
        // IDが空配列の場合はDBアクセスせずに空を返す
        if (userIds.length === 0) {
            return okAsync([]);
        }
        return userRepo.findByIds(userIds);
    },

    updateUser: (userId, dto) => {
        return validateUserId(userId)
            .andThen(() => userRepo.findById(userId))
            .andThen((existingUser) => {
                const updatedUser: User = {
                    ...existingUser,
                    ...dto,
                    updated_at: Timestamp.now(),
                };
                return userRepo.update(updatedUser);
            });
    },
});
