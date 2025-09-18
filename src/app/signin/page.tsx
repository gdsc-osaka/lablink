"use client";
import React, { FormEvent } from "react";
import Link from "next/link";
import Head from "next/head";

interface SignInFormProps {
    onSignIn: (e: FormEvent) => void;
    onGoogleSignIn: () => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    email: string;
    password: string;
    isLoading: boolean;
    errorMessage: string;
}

const SignInForm: React.FC<SignInFormProps> = ({
    onSignIn,
    onGoogleSignIn,
    onEmailChange,
    onPasswordChange,
    email,
    password,
    isLoading,
    errorMessage,
}) => {
    return (
        <>
            <Head>
                <title>lablink - サインイン</title>
            </Head>
            <div className="font-sans flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
                <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-11/12">
                    <button
                        onClick={onGoogleSignIn}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center w-full"
                        disabled={isLoading}
                    >
                        Google で続ける
                    </button>
                    <div className="my-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">
                                または
                            </span>
                        </div>
                    </div>
                    <form onSubmit={onSignIn} className="mt-8">
                        <div className="mb-5 text-left">
                            <label
                                htmlFor="email"
                                className="block text-gray-700 font-bold mb-1"
                            >
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="your_email@example.com"
                                value={email}
                                onChange={(e) => onEmailChange(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                required
                            />
                        </div>
                        <div className="mb-5 text-left">
                            <label
                                htmlFor="password"
                                className="block text-gray-700 font-bold mb-1"
                            >
                                パスワード
                            </label>
                            <input
                                type="password"
                                id="password"
                                placeholder="パスワード"
                                value={password}
                                onChange={(e) =>
                                    onPasswordChange(e.target.value)
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out w-full"
                            disabled={isLoading}
                        >
                            サインイン
                        </button>
                        {isLoading && (
                            <div className="border-4 border-gray-200 border-t-blue-600 rounded-full w-8 h-8 animate-spin mx-auto mt-5"></div>
                        )}
                        {errorMessage && (
                            <p className="text-red-500 text-sm mt-5">
                                {errorMessage}
                            </p>
                        )}
                    </form>
                    <p className="mt-6 text-sm text-gray-600">
                        まだアカウントをお持ちでないですか？{" "}
                        <Link href="/signup" passHref legacyBehavior>
                            <a className="text-blue-600 font-bold hover:underline">
                                新規登録はこちら
                            </a>
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default SignInForm;
