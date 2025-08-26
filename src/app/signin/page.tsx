import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from 'C:/Users/sakur/lablink/src/firebase/config';

export default function SignInPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('すべての項目を入力してください。');
      setIsLoading(false);
      return;
    }

    
    try {
      // Firebaseでメールアドレスとパスワードでサインイン
      await signInWithEmailAndPassword(auth, email, password);
      console.log('サインイン成功！');

      // const router = useRouter();
      // router.push('/dashboard'); 
      
      setErrorMessage('サインインが完了しました。');
      
    } catch (error: any) {
      console.error("サインインエラー:", error);
   
      let message = 'サインインに失敗しました。';
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'メールアドレスの形式が正しくありません。';
          break;
        case 'auth/user-disabled':
          message = 'このアカウントは無効化されています。';
          break;
        case 'auth/user-not-found':
          message = 'このメールアドレスを持つユーザーは見つかりませんでした。';
          break;
        case 'auth/wrong-password':
          message = 'パスワードが正しくありません。';
          break;
        default:
          message = `サインインに失敗しました: ${error.message}`;
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>lablink - サインイン</title>
      </Head>
      <div className="font-sans flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-11/12">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Googleアカウントでサインイン</h1>
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="mb-5 text-left">
              <label htmlFor="email" className="block text-gray-700 font-bold mb-1">メールアドレス</label>
              <input
                type="email"
                id="email"
                placeholder="your_email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            <div className="mb-5 text-left">
              <label htmlFor="password" className="block text-gray-700 font-bold mb-1">パスワード</label>
              <input
                type="password"
                id="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <p className="text-red-500 text-sm mt-5">{errorMessage}</p>
            )}
          </form>
          <p className="mt-6 text-sm text-gray-600">
            まだアカウントをお持ちでないですか？{' '}
            <Link href="/signup">
              <a className="text-blue-600 font-bold hover:underline">新規登録はこちら</a>
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}