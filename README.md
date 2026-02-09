# lablink

研究室向けのの日程調整アプリ。メンバーの Google カレンダーの空き状況をもとに、LLM が最適なイベント日程を提案する。

## 技術スタック

| カテゴリ       | 技術                                      |
| -------------- | ----------------------------------------- |
| フレームワーク | Next.js 16 (App Router, Turbopack)        |
| 言語           | TypeScript 5                              |
| UI             | shadcn/ui + Tailwind CSS v4               |
| 認証           | Firebase Authentication (Google ログイン) |
| データベース   | Cloud Firestore                           |
| テスト         | Vitest                                    |
| デプロイ       | Firebase App Hosting                      |
| CI             | GitHub Actions                            |

## セットアップ

### 前提条件

- Node.js 20 以上
- pnpm 10 以上

### 手順

```bash
# リポジトリをクローン
git clone https://github.com/gdsc-osaka/lablink.git
cd lablink

# 依存関係をインストール
pnpm install
```

### 環境変数の設定

`.env.local` をプロジェクトルートに作成し、以下の変数を設定してください。値はチームメンバーから共有を受けてください。

```bash
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

## コマンド一覧

| コマンド             | 説明                           |
| -------------------- | ------------------------------ |
| `pnpm dev`           | 開発サーバーを起動 (Turbopack) |
| `pnpm build`         | プロダクションビルド           |
| `pnpm start`         | ビルド済みアプリを起動         |
| `pnpm lint`          | ESLint + Prettier のチェック   |
| `pnpm fix`           | ESLint + Prettier の自動修正   |
| `pnpm test`          | テストを実行                   |
| `pnpm test:watch`    | テストをウォッチモードで実行   |
| `pnpm test:coverage` | カバレッジ付きでテストを実行   |

## プロジェクト構成

```
src/
├── app/          # Next.js App Router (ページ・レイアウト・API)
├── components/   # React コンポーネント (ui/ に shadcn/ui)
├── domain/       # ドメインモデル・インターフェース
├── service/      # ビジネスロジック
├── infra/        # リポジトリ実装 (Firestore)
├── lib/          # ユーティリティ (認証・日付・AI フォーマット)
├── hooks/        # カスタムフック
├── provider/     # React コンテキストプロバイダー
└── firebase/     # Firebase クライアント・Admin 初期化
```

## デプロイ

- **本番デプロイ**: `main` ブランチへのマージで Firebase App Hosting が自動デプロイ
- **CI**: PR 作成時に GitHub Actions で Lint / Test / Build を実行
