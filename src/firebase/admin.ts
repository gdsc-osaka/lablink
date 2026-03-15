import "server-only";

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseApp(): admin.app.App {
    if (admin.apps.length) {
        return admin.apps[0]!;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
        throw new Error(
            "Firebase configuration error: Missing required environment variables (NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, or FIREBASE_CLIENT_EMAIL)",
        );
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, "\n"),
            clientEmail,
        }),
    });
}

export function getAuthAdmin(): admin.auth.Auth {
    return getFirebaseApp().auth();
}

export function getFirestoreAdmin(): FirebaseFirestore.Firestore {
    return getFirestore(getFirebaseApp());
}
