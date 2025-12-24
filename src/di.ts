import { createGroupService } from "./service/group-service";
import { firestoreGroupRepository } from "./infra/group/group-repo";
import { firestoreUserGroupRepository } from "./infra/group/user-group-repository";
import { userRepo } from "./infra/user/user-repo";

export const groupService = createGroupService({
    groupRepo: firestoreGroupRepository,
    userGroupRepo: firestoreUserGroupRepository,
    userRepo: userRepo,
});
