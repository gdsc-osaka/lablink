import { doc, getDoc, setDoc, collection, query, where, documentId, getDocs } from "firebase/firestore";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { UserRepository } from "@/domain/user";
import { NotFoundError } from "@/domain/error";
import { db } from "@/firebase/client";
import { userConverter } from "@/infra/user/user-converter";
import { handleFirestoreError } from "@/infra/error";
import { snapshot } from "node:test";

const userRef = (id: string) =>
    doc(db, "users", id).withConverter(userConverter);

const usersCol = collection(db, "users").withConverter(userConverter);

export const userRepo: UserRepository = {
    create: (user) =>
        ResultAsync.fromPromise(
            setDoc(userRef(user.id), user),
            handleFirestoreError,
        ).map(() => user),
    findById: (uid) =>
        ResultAsync.fromPromise(
            getDoc(userRef(uid)),
            handleFirestoreError,
        ).andThen((snapshot) =>
            snapshot.exists()
                ? okAsync(snapshot.data()!)
                : errAsync(NotFoundError("User not found")),
        ),    
        findByIds: (uids) =>{
            if(uids.length === 0) return okAsync([]);
            
            const q = query(usersCol, where(documentId(), "in" ,uids));
            return ResultAsync.fromPromise(
                getDocs(q),
                handleFirestoreError,
            ).map((snapshot) => snapshot.docs.map((doc) => doc.data()));
        },
        
    update: (user) =>
        ResultAsync.fromPromise(
            setDoc(userRef(user.id), user, { merge: true }),
            handleFirestoreError,
        ).map(() => user),

};
