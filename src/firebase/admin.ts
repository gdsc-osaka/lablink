// /src/firebase/admin.ts
import admin from "firebase-admin";

function getFirebaseApp(): admin.app.App {
    if (admin.apps.length) {
        return admin.apps[0]!;
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
}

export function getAuthAdmin(): admin.auth.Auth {
    return getFirebaseApp().auth();
}
