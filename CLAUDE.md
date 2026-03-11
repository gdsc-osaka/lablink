# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

lablink は研究室向けの日程調整アプリ。メンバーの Google カレンダーの空き状況をもとに、LLM が最適なイベント日程を提案する。

**Tech stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, shadcn/ui, Firebase Auth + Firestore, Vitest

## Commands

```bash
pnpm dev           # 開発サーバー起動 (http://localhost:3000)
pnpm build         # プロダクションビルド
pnpm lint          # ESLint + Prettier チェック
pnpm fix           # ESLint + Prettier 自動修正
pnpm test          # テスト実行
pnpm test:watch    # ウォッチモード
pnpm test:coverage # カバレッジ付き
```

テストファイルは `src/**/__tests__/*.test.ts` または `test/**/*.test.ts` に配置する。

## Architecture

### Layered Structure

```
domain/     → インターフェース・型定義のみ（実装を含まない）
service/    → ビジネスロジック（domain のインターフェースに依存）
infra/      → Firestore 実装（client 用と admin 用が分かれる）
lib/        → ユーティリティ（認証・日付・AI整形）
app/        → Next.js ページ・Server Actions・API Routes
provider/   → React Context プロバイダー
firebase/   → Firebase client/admin 初期化
```

### Key Patterns

**Repository pattern:** `domain/` にインターフェースを定義し、`infra/` で Firestore 実装を提供する。例: `GroupRepository` (domain) → `firestoreGroupRepository` (infra/group/group-repo.ts)。

**Result type:** エラーハンドリングに `neverthrow` の `ResultAsync<T, E>` を使用する。例外を throw せず、エラーを型として扱う。

**エラー型:** `obj-err` の `errorBuilder` でエラーを構築する（`src/domain/error.ts`）。`DBError` は `NotFoundError | PermissionDeniedError | UnauthenticatedError | UnknownError` のユニオン型。

**Client/Admin 分離:** Firebase は `src/firebase/client.ts`（ブラウザ用）と `src/firebase/admin.ts`（サーバー用）に分かれる。Firestore リポジトリも同様に `*-repo.ts`（client SDK）と `*-admin-repo.ts`（Admin SDK）が存在する。

**認証フロー:** Firebase Auth でログイン → IDトークンを `createAuthSession()` でセッションクッキーに変換（14日間）→ Server Actions では `requireAuth()` でセッション検証。クライアント側は `AuthProvider` / `useAuth()` で Firebase Auth 状態を監視。

**Server Actions:** `src/app/actions.ts` および各ページの `actions.ts` に `"use server"` で定義。カレンダー空き時間取得（Google Calendar API）などはここで行う。

### Application Flow (AI日程提案)

1. ユーザーがイベント要件を入力（`EventDraft`）
2. Google Calendar freebusy API で参加者全員の予定を取得
3. `findCommonFreeSlots()` で共通空き時間を計算
4. `formatFreeSlotsForAI()` でAI向けテキストに整形
5. Gemini API に渡して日程提案（現在は未実装・コメントアウト済み）
6. ユーザーが日程を選択 → Firestore に `Event` として保存

### Route Structure

- `/` → トップページ
- `/login` → Google ログイン
- `/(auth)/group` → グループ一覧・詳細（認証必須）
- `/(auth)/create-event` → イベント作成フォーム
- `/(auth)/ai-suggest` → AI提案日程選択（現在は仮データ）
- `/(auth)/invite` → 招待リンク作成
- `/(auth)/invited` → 招待受諾

### Environment Variables

`.env.local` に設定が必要:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```
