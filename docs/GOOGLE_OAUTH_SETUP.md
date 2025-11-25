# Google OAuth 2.0 セットアップガイド

このドキュメントは、Google Calendar API アクセスのための OAuth 2.0 認証を設定する手順を説明します。

## 前提条件

- Google Cloud Platform のプロジェクト（lablink-f9171）が作成済み
- Firebase Authentication が有効化済み

---

## 1. Google Cloud Console にアクセス

```
https://console.cloud.google.com/apis/credentials?project=lablink-f9171
```

---

## 2. OAuth 同意画面の設定

### 手順

1. 左側メニューから **「OAuth 同意画面」** を選択
2. **User Type** を選択:
    - **外部（External）** を選択（テスト段階では外部でOK）
    - 「作成」をクリック
3. **アプリ情報** を入力:
    - **アプリ名**: lablink
    - **ユーザーサポートメール**: litchi7777@gmail.com
    - **デベロッパーの連絡先情報**: litchi7777@gmail.com
4. **スコープ** ページ:
    - 「スコープを追加または削除」をクリック
    - 以下のスコープを追加:
        - `https://www.googleapis.com/auth/calendar.readonly`
        - `https://www.googleapis.com/auth/calendar.events.readonly`
        - `.../auth/userinfo.email`
        - `.../auth/userinfo.profile`
        - `openid`
5. **テストユーザー** ページ:
    - 「ユーザーを追加」をクリック
    - テストユーザーのメールアドレスを追加:
        - `litchi7777@gmail.com`
        - その他のテストユーザー（チームメンバー）
6. 「保存して次へ」をクリック

---

## 3. OAuth 2.0 クライアント ID の作成

### 手順

1. 左側メニューから **「認証情報」** を選択
2. 上部の **「+ 認証情報を作成」** をクリック
3. **「OAuth クライアント ID」** を選択
4. **アプリケーションの種類**:
    - **ウェブ アプリケーション** を選択
5. **名前**:
    - `lablink-oauth-client` など、わかりやすい名前を入力
6. **承認済みの JavaScript 生成元** を追加:
    - `http://localhost:3000` （開発環境）
    - 本番環境の URL（デプロイ後）
7. **承認済みのリダイレクト URI** を追加:
    - `http://localhost:3000/api/auth/callback` （開発環境）
    - 本番環境の URL（例: `https://yourdomain.com/api/auth/callback`）
8. **「作成」** をクリック

### 結果

- **クライアント ID** が表示される
- **クライアント シークレット** が表示される
- これらを `.env.local` にコピーする

---

## 4. Google Calendar API を有効化

### 手順

1. 左側メニューから **「ライブラリ」** を選択
2. 検索ボックスに **「Google Calendar API」** と入力
3. **Google Calendar API** をクリック
4. **「有効にする」** をクリック

---

## 5. .env.local の更新

取得した **クライアント ID** と **クライアント シークレット** を `.env.local` に設定します。

```bash
# Google OAuth 2.0 Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=【取得したクライアントID】
GOOGLE_CLIENT_SECRET=【取得したクライアントシークレット】
```

### 例:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
```

---

## 6. 動作確認

### 開発サーバーを起動

```bash
npm run dev
```

### テスト手順

1. ブラウザで `http://localhost:3000/login` にアクセス
2. 「ログイン」ボタンをクリック
3. `/signin` ページに遷移
4. 「Googleでログイン」ボタンをクリック
5. Google OAuth 認証画面が表示される
6. テストユーザーでログイン
7. Calendar API へのアクセス許可を確認
8. ログイン成功後、ホームページにリダイレクト

### 確認ポイント

✅ Google OAuth 認証画面が正しく表示される
✅ Calendar API のスコープが表示される
✅ ログイン後、Firestore にリフレッシュトークンが保存される

### Firestore でトークン確認

Firebase Console → Firestore Database → `users` コレクション → ユーザードキュメント

以下のフィールドが追加されていることを確認:

- `google_refresh_token_encrypted`: 暗号化されたリフレッシュトークン
- `google_token_expires_at`: トークンの有効期限

---

## トラブルシューティング

### エラー: `Error 401: invalid_client`

**原因**: OAuth クライアント ID が正しく設定されていない

**解決策**:

1. `.env.local` の `NEXT_PUBLIC_GOOGLE_CLIENT_ID` が正しいか確認
2. Google Cloud Console で OAuth クライアント ID が作成されているか確認
3. 開発サーバーを再起動: `npm run dev`

---

### エラー: `Error 400: redirect_uri_mismatch`

**原因**: リダイレクト URI が Google Cloud Console で承認されていない

**解決策**:

1. Google Cloud Console → OAuth 2.0 クライアント ID
2. **承認済みのリダイレクト URI** に以下を追加:
    - `http://localhost:3000/api/auth/callback`
3. 設定を保存して、数分待つ

---

### エラー: `Access blocked: This app's request is invalid`

**原因**: OAuth 同意画面が正しく設定されていない

**解決策**:

1. Google Cloud Console → OAuth 同意画面
2. 必要なスコープが追加されているか確認
3. テストユーザーが追加されているか確認
4. 公開ステータスが「テスト」になっているか確認

---

### エラー: リフレッシュトークンが null

**原因**:

- 2回目以降のログインでリフレッシュトークンが返されない
- `prompt: 'consent'` が設定されていない

**解決策**:

1. Google アカウント設定 → セキュリティ → サードパーティによるアクセス
2. lablink アプリのアクセスを削除
3. 再度ログインして、リフレッシュトークンを取得

---

## セキュリティに関する注意事項

### 本番環境へのデプロイ前

1. **OAuth 同意画面を「本番」に変更**
    - Google の審査が必要になる場合がある

2. **リダイレクト URI を本番 URL に変更**
    - 例: `https://lablink.example.com/api/auth/callback`

3. **環境変数を GitHub Secrets に登録**
    - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `TOKEN_ENCRYPTION_KEY`

4. **Firestore セキュリティルールを設定**
    - トークンフィールドへのクライアントアクセスを制限

---

## 参考リンク

- [Google OAuth 2.0 ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API ドキュメント](https://developers.google.com/calendar/api/v3/reference)
- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)
