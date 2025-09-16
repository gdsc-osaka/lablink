"use client"

import Head from 'next/head';
import { useRouter } from 'next/router';


export default function LoginPage(){
  const router = useRouter();

  const handleLoginButtonClick = () => {
    router.push('/signin');
  };

  return (
    <>
      <Head>
        <title>lablink - ログイン</title>
      </Head>
      <div className="font-sans flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-11/12">
          <h1 className="text-3xl font-bold text-gray-800 mb-5">lablinkへようこそ</h1>
          <p className="mb-8 leading-relaxed">スケジュール管理を始めるにはログインしてください。</p>
          <button
            onClick={handleLoginButtonClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center w-full"
          >
            ログイン
          </button>
        </div>
      </div>
    </>
  );
}