"use client";
import React, { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, getIdToken, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";

import { auth, db } from "@/firebase/client.ts";

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

    useEffect(() => {
        // Firebase Authの状態監視
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

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
