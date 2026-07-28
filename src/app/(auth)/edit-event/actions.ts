"use server";

import { requireAuth } from "@/lib/auth/server-auth";
import { firestoreEventAdminRepository } from "@/infra/event/event-admin-repo";
import type { Event } from "@/domain/event";
import { revalidatePath } from "next/cache";
import { authorizeGroupMember } from "@/app/(auth)/group/actions";

export async function updateEventAction(
    groupId: string,
    event: Event,
): Promise<{ success: true } | { success: false; error: string }> {
    const decodedClaims = await requireAuth();
    const auth = await authorizeGroupMember(groupId, decodedClaims.uid);
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    const result = await firestoreEventAdminRepository.updateNewEvent(
        groupId,
        event,
    );
    return result.match(
        () => {
            revalidatePath("/group");
            return { success: true as const };
        },
        (err) => ({ success: false, error: err.message }),
    );
}
