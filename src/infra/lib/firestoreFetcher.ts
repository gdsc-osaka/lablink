// fetch用のカスタムフックで使用するFirestore用fetcher関数です

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/client";

export const firestoreFetcher = async (path : string) => {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        const error = new Error(`Document at path ${path} not found`);
        throw error;
    }

    return { id: docSnap.id, ...docSnap.data() };
}