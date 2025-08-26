// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; 
import { auth } from 'C:/Users/sakur/lablink/src/firebase/config';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // ログイン成功時の処理
      console.log('Google認証成功！ユーザー:', result.user);

      // redirectToパラメータを確認
      const { redirectTo } = router.query;
      if (typeof redirectTo === 'string') {
        router.push(redirectTo);
      } else {
        router.push('/create-group'); // グループ作成ページへ遷移　★要変更★
      }

    } catch (error: any) {
      console.error("認証エラー:", error);
      setErrorMessage(`ログインに失敗しました: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>lablink - ログイン</title>
      </Head>
      <div className="font-sans flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-11/12">
          <h1 className="text-2xl font-bold text-gray-800 mb-5">lablinkへようこそ</h1>
          <p className="mb-8 leading-relaxed">スケジュール管理を始めるにはログインしてください。</p>
          <button
            onClick={handleGoogleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center w-full"
            disabled={isLoading}
          >
            Google で続ける
          </button>
          {isLoading && (
            <div className="border-4 border-gray-200 border-t-blue-600 rounded-full w-8 h-8 animate-spin mx-auto mt-5"></div>
          )}
          {errorMessage && (
            <p className="text-red-500 text-sm mt-5">{errorMessage}</p>
          )}
        </div>
      </div>
    </>
  );
}