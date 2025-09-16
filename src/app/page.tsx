// components/test/NavigationTest.tsx
// このファイルは、`pages`ディレクトリに配置して、ブラウザで確認するためのテスト用ページとして機能します。

"use client";

import { useState } from 'react';
import LoginPage from './login/page'; // LoginPageをインポート
import SignInForm from './signin/page'; // SignInFormをインポート

export default function NavigationTestPage() {
  // 現在表示しているページを管理するための状態
  const [currentPage, setCurrentPage] = useState('login');
  
  // onLoginハンドラ：ログインボタンがクリックされたら、SignInページに遷移する
  const handleLoginClick = () => {
    setCurrentPage('signin');
  };

  // onSignInハンドラ：サインイン処理をシミュレートする（ここではページ遷移のみ）
  const handleSignIn = () => {
    alert("サインインに成功しました！");
    // 成功後の遷移先をシミュレート
    setCurrentPage('home'); // 例としてホーム画面に戻る
  };

  // onGoogleSignInハンドラ：Googleログイン処理をシミュレートする（ここではページ遷移のみ）
  const handleGoogleSignIn = () => {
    alert("Googleでサインインに成功しました！");
    setCurrentPage('home');
  };

  // 表示するコンポーネントを切り替える
  if (currentPage === 'signin') {
    // SignInPageをレンダリングする
    return (
      <SignInForm
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailChange={() => {}} // ダミー関数
        onPasswordChange={() => {}} // ダミー関数
        email="" // ダミーデータ
        password="" // ダミーデータ
        isLoading={false}
        errorMessage=""
      />
    );
  }
  
  // LoginPageをレンダリングする
  return (
    <LoginPage handleLoginButtonClick={handleLoginClick} />
  );
}