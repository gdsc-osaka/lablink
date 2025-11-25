# GitHub Secrets セットアップガイド

## 📋 概要

このドキュメントでは、GitHub Actions でのデプロイに必要な環境変数（Secrets）の設定方法を説明します。

---

## 🔑 必要な Secrets 一覧

| Secret 名                                 | 説明                                  | 取得方法             |
| ----------------------------------------- | ------------------------------------- | -------------------- |
| `TOKEN_ENCRYPTION_KEY`                    | トークン暗号化キー（32バイト）        | 自動生成             |
| `GEMINI_API_KEY`                          | Gemini API キー                       | Google AI Studio     |
| `GOOGLE_CLIENT_ID`                        | Google OAuth クライアントID           | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET`                    | Google OAuth クライアントシークレット | Google Cloud Console |
| `NEXT_PUBLIC_FIREBASE_API_KEY`            | Firebase API キー                     | Firebase Console     |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`        | Firebase 認証ドメイン                 | Firebase Console     |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`         | Firebase プロジェクトID               | Firebase Console     |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`     | Firebase ストレージバケット           | Firebase Console     |
| `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID` | Firebase メッセージング送信者ID       | Firebase Console     |
| `NEXT_PUBLIC_FIREBASE_APP_ID`             | Firebase アプリID                     | Firebase Console     |

---

## 🚀 GitHub Secrets の設定手順

### ステップ1: GitHub リポジトリにアクセス

1. ブラウザで以下にアクセス:

    ```
    https://github.com/gdsc-osaka/lablink
    ```

2. リポジトリの **Settings** タブをクリック

### ステップ2: Secrets ページに移動

1. 左サイドバーの **Secrets and variables** をクリック
2. **Actions** を選択

### ステップ3: Secrets を追加

#### 3-1. TOKEN_ENCRYPTION_KEY を追加

1. **New repository secret** ボタンをクリック

2. 以下を入力:

    ```
    Name: TOKEN_ENCRYPTION_KEY
    Secret: 5f71475b22e5325da97bb97e6efb3f369c59acb6e24804f102efb4ff4a70460b
    ```

    **⚠️ 重要**: 開発環境の `.env.local` に設定した値と**同じ**値を使用してください。

3. **Add secret** をクリック

#### 3-2. GEMINI_API_KEY を追加

1. **New repository secret** ボタンをクリック

2. 以下を入力:

    ```
    Name: GEMINI_API_KEY
    Secret: （.env.local の GEMINI_API_KEY の値）
    ```

3. **Add secret** をクリック

#### 3-3. Firebase 関連の Secrets を追加

以下の Secrets を同様に追加:

```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Secret: （.env.local の値）

Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Secret: lablink-f9171.firebaseapp.com

Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Secret: lablink-f9171

Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Secret: lablink-f9171.firebasestorage.app

Name: NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID
Secret: 418813881670

Name: NEXT_PUBLIC_FIREBASE_APP_ID
Secret: 1:418813881670:web:fc41a75f115589bea64947
```

#### 3-4. Google OAuth 関連の Secrets を追加（後で）

Google OAuth フローを実装する際に追加:

```
Name: GOOGLE_CLIENT_ID
Secret: （Google Cloud Console で取得）

Name: GOOGLE_CLIENT_SECRET
Secret: （Google Cloud Console で取得）
```

---

## ✅ 設定確認

### 確認方法

1. GitHub リポジトリの **Settings** → **Secrets and variables** → **Actions** を開く

2. 以下の Secrets が表示されていることを確認:
    - ✅ `TOKEN_ENCRYPTION_KEY`
    - ✅ `GEMINI_API_KEY`
    - ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
    - ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    - ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    - ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    - ✅ `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID`
    - ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## 🔧 GitHub Actions での使用方法

### ワークフローファイルの例

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"

            - name: Install dependencies
              run: npm ci

            - name: Build
              run: npm run build
              env:
                  # GitHub Secrets から環境変数を注入
                  TOKEN_ENCRYPTION_KEY: ${{ secrets.TOKEN_ENCRYPTION_KEY }}
                  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
                  NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
                  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
                  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
                  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
                  NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID }}
                  NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}

            - name: Deploy to Firebase
              run: firebase deploy
              env:
                  FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## 🔒 セキュリティのベストプラクティス

### ✅ やるべきこと

1. **Secrets は公開しない**
    - GitHub Secrets に設定した値は暗号化されて保存される
    - ワークフローログにも表示されない（`***` で隠される）

2. **開発環境と本番環境で同じ暗号化キーを使う**
    - `TOKEN_ENCRYPTION_KEY` は全環境で同じ値を使用
    - データの互換性を保つため

3. **定期的にキーをローテーション**
    - 半年〜1年ごとに暗号化キーを更新
    - 更新時は既存データの再暗号化が必要

### ❌ やってはいけないこと

1. **Secrets をコードにコミットしない**
    - `.env.local` は `.gitignore` に含める
    - 環境変数ファイルは絶対にコミットしない

2. **Secrets をログに出力しない**
    - `console.log(process.env.TOKEN_ENCRYPTION_KEY)` は禁止
    - デバッグ時は値を出力しない

3. **Public リポジトリで Secrets を使わない**
    - このリポジトリは Private のはず
    - Public にする場合は注意が必要

---

## 🛠️ トラブルシューティング

### 問題1: ビルド時に環境変数が読み込まれない

**原因**: GitHub Secrets が正しく設定されていない

**解決方法**:

1. Settings → Secrets and variables → Actions を確認
2. Secret 名のスペルミスがないか確認
3. ワークフローファイルで `${{ secrets.SECRET_NAME }}` が正しいか確認

### 問題2: 暗号化キーが違うエラー

**原因**: 開発環境と本番環境で異なるキーを使用している

**解決方法**:

1. `.env.local` の `TOKEN_ENCRYPTION_KEY` をコピー
2. GitHub Secrets の `TOKEN_ENCRYPTION_KEY` を同じ値に更新

### 問題3: Firebase デプロイがエラーになる

**原因**: Firebase 環境変数が不足している

**解決方法**:

1. すべての `NEXT_PUBLIC_FIREBASE_*` が設定されているか確認
2. Firebase Console で正しい値を確認

---

## 📝 チェックリスト

### 初回セットアップ時

- [ ] `TOKEN_ENCRYPTION_KEY` を GitHub Secrets に追加
- [ ] `GEMINI_API_KEY` を GitHub Secrets に追加
- [ ] Firebase 関連の Secrets（6個）を追加
- [ ] `.gitignore` に `.env.local` が含まれていることを確認
- [ ] ワークフローファイルで環境変数を注入していることを確認

### デプロイ前

- [ ] すべての Secrets が設定されているか確認
- [ ] ローカルでビルドが成功するか確認（`npm run build`）
- [ ] テストが通るか確認（`npm test`）

---

## 🔗 参考リンク

- [GitHub Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Hosting environment configuration](https://firebase.google.com/docs/hosting/full-config)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**最終更新**: 2025-11-19
