"use client";

import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";

import {
    signInWithPopup,
    GoogleAuthProvider,
    User,
    AuthError,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ResultAsync } from "neverthrow";

import { auth, db } from "@/firebase/client";

// Googleサインイン処理
const signInWithGoogle = (): ResultAsync<User, AuthError> => {
    const provider = new GoogleAuthProvider();

    return ResultAsync.fromPromise(
        signInWithPopup(auth, provider).then((result) => result.user),
        (e) => e as AuthError,
    );
};

// Firestoreにユーザーを登録（初回のみ）
const createUserInFirestore = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }
};

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSignIn = async () => {
        const result = await signInWithGoogle();

        result.match(
            async (user) => {
                // Firestoreに登録
                await createUserInFirestore(user);

                // redirectToが指定されていればそのページへ、なければグループ作成ページへ
                const redirectTo = searchParams.get("redirectTo");

                if (redirectTo) {
                    router.push(`/groups/${redirectTo}`);
                } else {
                    router.push("/create-groups");
                }
            },
            (error) => {
                console.error("Google認証に失敗しました:", error.message);
                alert("ログインに失敗しました。再度お試しください。");
            },
        );
    };

    return (
        <>
            <Head>
                <title>lablink - ログイン</title>
            </Head>
            <div className="font-sans flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
                <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-11/12">
                    <h1 className="text-3xl font-bold text-gray-800 mb-5">
                        lablinkへようこそ
                    </h1>
                    <p className="mb-8 leading-relaxed">
                        スケジュール管理を始めるにはログインしてください。
                    </p>
                    <button
                        onClick={handleSignIn}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center w-full"
                    >
                        Googleでログイン
                    </button>
                </div>
            </div>
        </>
    );
}
