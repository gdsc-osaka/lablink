import { Group, GroupRepository, CreateGroupDto, UserGroup, UserGroupRepository } from "@/domain/group";
import { Result, ServiceError, ServiceLogicError, NotFoundError, DBError } from "@/domain/error";

const generateId = (): string => crypto.randomUUID();

export class GroupService {
    private groupRepo: GroupRepository;
    private userGroupRepo: UserGroupRepository;

    constructor(groupRepo: GroupRepository, userGroupRepo: UserGroupRepository) {
        this.groupRepo = groupRepo;
        this.userGroupRepo = userGroupRepo;
    }


    async createGroupAndAddOwner(
        userId: string,
        dto: CreateGroupDto,
    ): Promise<Result<Group>> {
        if (!userId) {
            return {
                success: false,
                error: ServiceLogicError("ユーザーIDは必須です。", { code: "MISSING_USER_ID" }),
            };
        }
        if (!dto.name || dto.name.trim() === "") {
            return {
                success: false,
                error: ServiceLogicError("グループ名は必須です。", { code: "INVALID_GROUP_NAME" }),
            };
        }

        try {
            const newGroupId = generateId();
            const now = new Date();

            const newGroup: Group = {
                id: newGroupId,
                name: dto.name,
                createdAt: now,
                updatedAt: now,
            };

            const savedGroup = await this.groupRepo.save(newGroup, userId);

            const membership: UserGroup = {
                groupId: savedGroup.id,
                userId: userId,
                role: "owner",
                joinedAt: now,
            };
            await this.userGroupRepo.addMember(membership, savedGroup);

            return { success: true, value: savedGroup };
        } catch (error) {
            console.error("Error creating group:", error);
            return {
                success: false,
                error: error as ServiceError,
            };
        }
    }



    async addGroupMember(
        userId: string,
        groupId: string,
    ): Promise<Result<void>> {
        if (!userId || !groupId) {
            return {
                success: false,
                error: ServiceLogicError("ユーザーIDとグループIDは必須です。", { code: "MISSING_IDS" }),
            };
        }

        try {
            const group = await this.groupRepo.findById(groupId);
            if (!group) {
                return {
                    success: false,
                    error: NotFoundError(`グループID ${groupId} が見つかりません。`,{extra: {}}),
                };
            }
            

            const membership: UserGroup = {
                groupId: groupId,
                userId: userId,
                role: "member", 
                joinedAt: new Date(),
            };
            await this.userGroupRepo.addMember(membership, group);

            return { success: true, value: undefined };
        } catch (error) {
            console.error("Error adding member:", error);
            return {
                success: false,
                error: error as ServiceError,
            };
        }
    }
    


    async getGroupById(groupId: string): Promise<Result<Group>> {
        if (!groupId) {
             return {
                success: false,
                error: ServiceLogicError("グループIDは必須です。", { code: "MISSING_GROUP_ID" }),
            };
        }

        try {
            const group = await this.groupRepo.findById(groupId);
            if (!group) {
                 return {
                    success: false,
                    error: NotFoundError(`グループID ${groupId} が見つかりません。`,{extra: {}}),
                };
            }
            return { success: true, value: group };
        } catch (error) {
            console.error("Error fetching group by ID:", error);
            return {
                success: false,
                error: error as ServiceError,
            };
        }
    }



    async updateGroupInfo(
        groupId: string,
        data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>,
    ): Promise<Result<Group>> {
        if (!groupId) {
            return {
                success: false,
                error: ServiceLogicError("グループIDは必須です。", { code: "MISSING_GROUP_ID" }),
            };
        }

        try {
            const updatedGroup = await this.groupRepo.update({ id: groupId, ...data });
            return { success: true, value: updatedGroup };
        } catch (error) {
            console.error("Error updating group:", error);
            return {
                success: false,
                error: error as ServiceError,
            };
        }
    }
    


    async getGroupsByUserId(userId: string): Promise<Result<Group[]>> {
         if (!userId) {
            return {
                success: false,
                error: ServiceLogicError("ユーザーIDは必須です。", { code: "MISSING_USER_ID" }),
            };
        }

        try {
            const groups = await this.userGroupRepo.findAllByUserId(userId);
            return { success: true, value: groups };
        } catch (error) {
            console.error("Error fetching groups by user ID:", error);
            return {
                success: false,
                error: error as ServiceError,
            };
        }
    }



    async getMemberIdsByGroupId(groupId: string): Promise<Result<string[]>> {
        if (!groupId) {
            return {
                success: false,
                error: ServiceLogicError("グループIDは必須です。", { code: "MISSING_GROUP_ID" }),
            };
        }

        try {
            const userIds = await this.userGroupRepo.findUserIdsByGroupId(groupId);
            return { success: true, value: userIds };
        } catch (error) {
            console.error("Error fetching member IDs by group ID:", error);
            return {
                success: false,
                error: error as ServiceError,
            };
        }
    }


    async deleteGroup(groupId: string): Promise<Result<void>> {
         if (!groupId) {
            return {
                success: false,
                error: ServiceLogicError("グループIDは必須です。", { code: "MISSING_GROUP_ID" }),
            };
        }

        // 削除前の権限チェック？？？
        // Cloud Functionsで連鎖削除を予定

        try {
            await this.groupRepo.delete(groupId);
            return { success: true, value: undefined };
        } catch (error) {
            console.error("Error deleting group:", error);
            return {
                success: false,
                error: error as ServiceError,
            };
        }
    }
}