import React, { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, getIdToken, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";

import { auth, db } from "@/firebase/client.ts";
import { zonedCurrentDate } from "@/lib/date";

type AuthContextType = {
    user: User | null;
    loading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Firestoreにユーザー登録（初回のみ）
    const createUserIfNotExists = async (user: User) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: zonedCurrentDate(),
            });
        }
    };

    useEffect(() => {
        // Firebase Authの状態監視
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                // Firestoreにユーザー情報を登録
                await createUserIfNotExists(currentUser);

                // Firebase IDトークンをCookieに保存
                const token = await getIdToken(currentUser, true);
                Cookies.set("token", token, { path: "/" });
            } else {
                setUser(null);
                Cookies.remove("token", { path: "/" });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
