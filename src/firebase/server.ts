import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK の初期化
 * サーバーサイドでのみ使用（API Routes等）
 */

let adminApp: App | undefined;
let _adminDb: Firestore | undefined;
let _adminAuth: Auth | undefined;

function initializeAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    if (getApps().length === 0) {
        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
                    /\\n/g,
                    "\n",
                ),
            }),
        });
    } else {
        adminApp = getApps()[0];
    }

    return adminApp;
}

export const adminDb: Firestore = new Proxy({} as Firestore, {
    get(_target, prop) {
        if (!_adminDb) {
            initializeAdminApp();
            _adminDb = getFirestore();
        }
        return (_adminDb as any)[prop];
    },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
    get(_target, prop) {
        if (!_adminAuth) {
            initializeAdminApp();
            _adminAuth = getAuth();
        }
        return (_adminAuth as any)[prop];
    },
});
