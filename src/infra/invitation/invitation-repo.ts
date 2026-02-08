import { InvitationRepository } from "@/domain/invitation";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { db } from "@/firebase/client";
import {
    collection,
    doc,
    getDocs,
    query,
    setDoc,
    where,
    deleteDoc,
} from "firebase/firestore";
import { invitationConverter } from "@/infra/invitation/invitation-converter";
import { handleFirestoreError } from "@/infra/error";
import { NotFoundError } from "@/domain/error";

const invitationsRef = collection(db, "invitations").withConverter(
    invitationConverter,
);
const invitationRef = (id: string) =>
    doc(db, "invitations", id).withConverter(invitationConverter);

export const invitationRepo: InvitationRepository = {
    create: (invitation) =>
        ResultAsync.fromPromise(
            setDoc(invitationRef(invitation.id), invitation),
            handleFirestoreError,
        ).map(() => invitation),
    findByToken: (token) =>
        ResultAsync.fromPromise(
            getDocs(query(invitationsRef, where("token", "==", token))),
            handleFirestoreError,
        )
            .map((snapshot) => snapshot.docs.map((doc) => doc.data()).at(0))
            .andThen((data) =>
                data === undefined
                    ? errAsync(NotFoundError("Invitation not found"))
                    : okAsync(data),
            ),
    delete: (invitationId) =>
        ResultAsync.fromPromise(
            deleteDoc(invitationRef(invitationId)),
            handleFirestoreError,
        ).map(() => undefined),
};
