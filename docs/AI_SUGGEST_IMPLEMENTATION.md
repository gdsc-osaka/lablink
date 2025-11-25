# AI Suggest 機能 実装管理ドキュメント

## 📋 概要

研究室での交流パーティー開催のために、Google Calendar を用いてスケジュール調整を半自動化する機能の実装を管理するドキュメント。

**最終更新日**: 2025-11-18

---

## 🎯 目標

### Goals

- グループメンバーの予定詳細は非公開のまま、Google Calendar の空き時間（Free/Busy）情報を読み取る
- 自然言語の目的から、AI が最適な日程候補を提示する
- 必須参加者を考慮して優先的に必須参加者が多い日程を選択する

### Non-goals

- イベントの出欠確認
- 集金
- 途中参加は考慮しない

---

## 📊 実装状況

### ✅ 完了済み

#### 基盤機能

- [x] Google Calendar API からの空き時間取得 (`src/app/actions.ts::getCommonAvailability`)
- [x] 複数人の予定重ね合わせロジック (`src/lib/availability.ts::findCommonFreeSlots`)
- [x] AI フォーマット用のデータ整形 (`src/lib/ai-formatter.ts`)
- [x] テスト環境の構築
    - [x] モックテスト (`src/lib/__tests__/calendar-api.test.ts`)
    - [x] 実際の API テストスクリプト (`test-real-calendar.ts`)

#### UI

- [x] AI 提案結果表示ページのモック (`src/app/ai-suggest/page.tsx`)

#### 環境設定

- [x] `.env.local` への環境変数追加
    - [x] `GEMINI_API_KEY`
    - [x] `GOOGLE_CALENDAR_ACCESS_TOKEN` (テスト用)
    - [x] `TEST_USER_EMAIL` (テスト用)

---

### 🚧 未実装

#### フェーズ1: データモデルとFirestore連携

- [ ] Firestore スキーマの確認・定義
    - [ ] `groups` コレクション構造の確認
    - [ ] `users` コレクション構造の確認
    - [ ] `members` コレクション構造の確認
    - [ ] OAuth トークン保存場所の確認
- [ ] 型定義の追加
    - [ ] `SuggestScheduleRequest` 型
    - [ ] `SuggestScheduleResponse` 型
    - [ ] `Member` 型（必須フラグ含む）
    - [ ] `ScoredCandidate` 型

#### フェーズ2: スコアリングロジック

- [ ] 30分スロット分割機能
    - [ ] 空き時間を30分単位のスロットに分割
    - [ ] スロットごとの参加可能メンバーリスト作成
- [ ] スコアリング機能
    - [ ] 必須メンバー: 10点、任意メンバー: 1点のスコアリング
    - [ ] `durationMinutes` に基づく連続スロット合計スコア計算
    - [ ] 時間帯フィルタリング（午前/午後/夕方/夜）
- [ ] 候補リストの生成
    - [ ] スコア順ソート
    - [ ] 上位候補の抽出

#### フェーズ3: Gemini API連携

- [ ] Gemini API クライアントの実装
    - [ ] プロンプト生成ロジック
    - [ ] API 呼び出し
    - [ ] JSON パース処理
    - [ ] リトライロジック（最大3回）
    - [ ] フォールバック処理（スコア上位3件を返す）

#### フェーズ4: Server Action統合

- [ ] `suggestSchedule` Server Action の実装
    - [ ] 認証チェック（ユーザーが認証済みか）
    - [ ] グループメンバー検証（ユーザーが groupId に所属しているか）
    - [ ] 必須メンバー検証（requiredMemberIds が groupId に所属しているか）
    - [ ] 全メンバーの OAuth トークン取得
    - [ ] Google Calendar API 呼び出し
    - [ ] スコアリング実行
    - [ ] Gemini API 呼び出し
    - [ ] レスポンス整形

#### フェーズ5: OAuth トークン管理

- [ ] Google ログイン機能の実装
    - [ ] ログインページの作成（`/signin`）
    - [ ] Google OAuth フロー実装
    - [ ] Calendar API スコープの追加
- [ ] OAuth トークンの Firestore 保存
    - [ ] ログイン時にトークンを保存
    - [ ] リフレッシュトークンの管理
    - [ ] トークン有効期限チェック

#### フェーズ6: UI連携

- [ ] イベント作成フォームの実装
    - [ ] 目的入力フィールド
    - [ ] 時間帯選択（午前/午後/夕方/夜）
    - [ ] 所要時間入力
    - [ ] 期間選択（開始日〜終了日）
    - [ ] 必須メンバー選択
- [ ] AI 提案結果ページとの連携
    - [ ] Server Action 呼び出し
    - [ ] ローディング状態の表示
    - [ ] エラーハンドリング
    - [ ] 結果の表示

---

## 🏗️ アーキテクチャ

### API インターフェース

#### リクエスト

```typescript
POST /api/suggestSchedule (Server Action)

{
  "groupId": "group-id-123",
  "description": "平日の夕方に研究室メンバーでたこやきパーティをする。",
  "requiredMemberIds": ["user-id-1", "user-id-2"],
  "durationMinutes": 120,
  "timeSlot": "afternoon", // "morning" | "afternoon" | "evening" | "night"
  "dateRange": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-15T23:59:59Z"
  }
}
```

#### レスポンス

```typescript
{
  "suggestions": [
    {
      "start": "2025-11-05T19:00:00Z",
      "end": "2025-11-05T21:00:00Z",
      "reason": "全員が参加可能で、ご要望の「平日の夜」に一致します。"
    },
    {
      "start": "2025-11-07T18:00:00Z",
      "end": "2025-11-07T20:00:00Z",
      "reason": "全員が参加可能です。"
    }
  ]
}
```

### 処理フロー

```
1. クライアント → Server Action 呼び出し
2. Server Action: 認証・検証
3. Server Action: Firestore からメンバー情報・OAuth トークン取得
4. Server Action: Google Calendar API で空き時間取得
5. Server Action: スコアリング（30分スロット単位）
6. Server Action: Gemini API でAI提案生成
7. Server Action: レスポンス返却
8. クライアント: 結果表示
```

### スコアリングアルゴリズム

1. 空き時間を30分単位のスロットに分割
2. 各スロットに対して以下のスコアを付与:
    - 必須メンバーが参加可能: **+10点**
    - 任意メンバーが参加可能: **+1点**
3. `durationMinutes` を満たす連続スロットの合計スコアを計算
4. 時間帯フィルタリング（指定された timeSlot に合致するか）
5. スコア上位の候補を Gemini に渡す

### Gemini プロンプト構造

設計ドキュメント参照: デザインドキュメントの「Gemini」セクション

---

## 📁 ファイル構成

```
src/
├── app/
│   ├── actions.ts                    # ✅ Server Actions (getCommonAvailability)
│   ├── ai-suggest/
│   │   └── page.tsx                  # ✅ AI提案結果表示ページ
│   ├── create-event/
│   │   └── page.tsx                  # 🚧 イベント作成フォーム（要実装）
│   └── login/
│       └── page.tsx                  # 🚧 ログインページ（要実装）
├── lib/
│   ├── availability.ts               # ✅ 空き時間計算ロジック
│   ├── ai-formatter.ts               # ✅ AIフォーマット用データ整形
│   ├── scoring.ts                    # 🚧 スコアリングロジック（未作成）
│   ├── gemini.ts                     # 🚧 Gemini API クライアント（未作成）
│   └── __tests__/
│       ├── calendar-api.test.ts      # ✅ Calendar API テスト
│       └── scoring.test.ts           # 🚧 スコアリングテスト（未作成）
├── domain/
│   ├── group.ts                      # ✅ グループドメイン型
│   └── member.ts                     # 🚧 メンバー型（要確認）
└── firebase/
    └── client.ts                     # ✅ Firebase 初期化

test-real-calendar.ts                 # ✅ 実際のAPI テストスクリプト
docs/
└── AI_SUGGEST_IMPLEMENTATION.md      # このファイル
```

---

## 🧪 テスト戦略

### 単体テスト

- [ ] スコアリングロジックのテスト
- [ ] 30分スロット分割のテスト
- [ ] 時間帯フィルタリングのテスト

### 統合テスト

- [x] Calendar API モックテスト
- [ ] Gemini API モックテスト
- [ ] Server Action 全体のテスト

### E2Eテスト

- [ ] イベント作成フロー全体のテスト

---

## 🔑 技術決定記録 (ADR)

### ADR-001: Gemini API の呼び出し方式

**ステータス**: Accepted

**決定内容**: AI-suggest 機能の Gemini API 呼び出しに Next.js Server Actions を利用する

**検討された選択肢**:

1. Firebase Functions
    - メリット: 処理を分離でき、負荷分散可能
    - デメリット: 新規セットアップが必要、管理が複雑化
2. Next.js Server Actions
    - メリット: 同じプロジェクト内で管理可能、セットアップ不要
    - デメリット: 処理負荷が Web App と同じサーバー

**決定の理由**:

- 今回の処理は Gemini API 呼び出しのみで重くない
- チームメンバーの実装経験
- 管理のシンプルさ

---

## 📝 開発メモ

### 2025-11-18

- Google Calendar API のテスト成功
- `.env.local` に `GOOGLE_CALENDAR_ACCESS_TOKEN` を追加
- `test-real-calendar.ts` で実際の API 呼び出しを確認
- 空き時間取得が正常に動作することを確認

### 懸念事項・課題

1. **OAuth トークンの管理**
    - 現在、テスト用に `.env.local` にトークンを保存
    - 本番環境では Firestore に保存が必要
    - リフレッシュトークンの管理方法を決定する必要あり

2. **トークンの有効期限**
    - Access Token は1時間程度で期限切れ
    - リフレッシュトークンを使った自動更新機能が必要

3. **スコアリングの詳細仕様**
    - 同点の場合の優先順位をどうするか
    - 時間帯の定義（午前: 6:00-12:00、午後: 12:00-18:00 など）

4. **Gemini のレスポンス品質**
    - JSON パースエラーへの対応
    - リトライ戦略の詳細

---

## 🔗 参考リンク

- [Google Calendar API - FreeBusy](https://developers.google.com/calendar/api/v3/reference/freebusy)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

## 👥 担当者

- 実装: TBD
- レビュー: TBD
- テスト: TBD

---

## 📅 スケジュール

| フェーズ                 | 予定期間 | ステータス |
| ------------------------ | -------- | ---------- |
| フェーズ1: データモデル  | TBD      | 未着手     |
| フェーズ2: スコアリング  | TBD      | 未着手     |
| フェーズ3: Gemini API    | TBD      | 未着手     |
| フェーズ4: Server Action | TBD      | 未着手     |
| フェーズ5: OAuth 管理    | TBD      | 未着手     |
| フェーズ6: UI 連携       | TBD      | 未着手     |

---

## 🚀 実装ステップ詳細（OAuth トークン管理）

### 現在の優先実装: OAuth トークン管理機能

チームでの議論により、以下の方針が決定:

- リフレッシュトークンを暗号化して Firestore に保存
- イベント作成時にリフレッシュトークンからアクセストークンを生成
- 各メンバーのカレンダー情報を取得

---

## 📋 実装ステップとコミットポイント

### ステップ0: 事前確認 ✅

**内容:**

- [x] チームでの方針確認
- [x] OAuth フローの理解
- [x] セキュリティ要件の確認

**成果物:** なし（議論のみ）

---

### ステップ1: 暗号化ライブラリの実装 ✅

**目的:** リフレッシュトークンを安全に保存するための暗号化機能

**タスク:**

- [x] `src/lib/encryption.ts` の作成
    - [x] `encryptToken()` 関数の実装
    - [x] `decryptToken()` 関数の実装
    - [x] `generateEncryptionKey()` ヘルパー関数
    - [x] エラーハンドリング
- [x] 暗号化キーの生成
    - [x] CLI コマンドで 32バイト（64文字）のキーを生成
    - [x] `.env.local` に `TOKEN_ENCRYPTION_KEY` を追加
- [x] 簡単なテストの実行
    - [x] 暗号化→復号化のラウンドトリップテスト

**成果物:**

```
src/lib/encryption.ts
.env.local（TOKEN_ENCRYPTION_KEY 追加）
```

**🔖 コミットポイント 1:**

```
feat: add token encryption utility

- Implement AES-256-CBC encryption for refresh tokens
- Add encryptToken and decryptToken functions
- Add encryption key validation
```

**確認事項:**

- ✅ 暗号化キーが正しく設定されているか
- ✅ 暗号化・復号化が正常に動作するか
- ✅ エラーハンドリングが適切か

---

### ステップ2: 型定義の追加 ✅

**目的:** OAuth トークン管理に必要な型を定義

**タスク:**

- [x] `src/domain/user.ts` の拡張
    - [x] `google_refresh_token_encrypted` フィールド追加
    - [x] `google_token_expires_at` フィールド追加（オプション）
- [x] `src/domain/oauth.ts` の作成（新規）
    - [x] `GoogleOAuthTokens` 型
    - [x] `TokenExchangeResponse` 型
    - [x] `RefreshTokenData` 型
- [x] `src/infra/user/user-converter.ts` の更新
    - [x] 新しいフィールドの Firestore 変換処理追加

**成果物:**

```typescript
// src/domain/user.ts（拡張）
interface User {
    email: string;
    created_at: Timestamp;
    updated_at: Timestamp;
    // 🆕 追加
    google_refresh_token_encrypted?: string;
    google_token_expires_at?: Timestamp;
}

// src/domain/oauth.ts（新規）
interface GoogleOAuthTokens {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
}
```

**🔖 コミットポイント 2:**

```
feat: add OAuth token type definitions

- Extend User type with Google OAuth fields
- Add GoogleOAuthTokens interface
- Add encrypted token field for security
```

**確認事項:**

- ✅ 既存の User 型との互換性
- ✅ オプショナルフィールドの適切な使用

---

### ステップ3-4-6 統合: Google OAuth フロー + トークン管理 ✅

**目的:** リフレッシュトークンの取得・暗号化・保存の完全実装

**タスク:**

- [x] 環境変数の追加
    - [x] `.env.local` に `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 追加
    - [x] `.env.local` に `GOOGLE_CLIENT_SECRET` 追加
- [x] `src/app/signin/page.tsx` の作成
    - [x] Google OAuth 2.0 認証 URL 生成
    - [x] `access_type: 'offline'` の設定
    - [x] Calendar スコープの追加
- [x] `src/app/api/auth/callback/route.ts` の作成
    - [x] Authorization Code の受け取り
    - [x] トークン交換処理
    - [x] リフレッシュトークンの暗号化
    - [x] Firestore への保存
    - [x] Firebase Auth へのログイン
- [x] `src/app/actions.ts` に Server Actions 追加
    - [x] `encryptTokenForStorage()` - トークン暗号化
    - [x] `decryptTokenFromStorage()` - トークン復号化

**成果物:**

```
src/app/signin/page.tsx（新規）
src/app/api/auth/callback/route.ts（新規）
src/app/actions.ts（Server Actions 追加）
src/domain/oauth.ts（OAuth 型定義）
.env.local（環境変数テンプレート追加）
```

**🔖 コミットポイント 3:**

```
feat: add Google OAuth and refresh token management

- Implement OAuth 2.0 flow for Google Calendar API
- Add signin page and callback handler
- Encrypt and store refresh tokens in Firestore
- Extend User type with OAuth token fields
- Add token encryption/decryption server actions
```

**確認事項:**

- ⚠️ **Google Cloud Console で OAuth 2.0 クライアント設定が必要**
    - リダイレクト URI: `http://localhost:3000/api/auth/callback`
    - Google Calendar API を有効化
- ⚠️ **`.env.local` の更新が必要**
    - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=【設定必要】`
    - `GOOGLE_CLIENT_SECRET=【設定必要】`
- ✅ トークンが暗号化されて保存される実装完了
- ⚠️ Firestore セキュリティルールは未設定（ステップ8で実装）

---

### ステップ5: アクセストークン生成機能

**目的:** リフレッシュトークンから新しいアクセストークンを生成

**タスク:**

- [ ] `src/app/actions.ts` に関数追加
    - [ ] `getAccessTokenFromRefreshToken()` の実装
        - [ ] Google OAuth 2.0 API への POST リクエスト
        - [ ] トークンレスポンスのパース
        - [ ] エラーハンドリング（期限切れ、無効など）
- [ ] 既存の `getCommonAvailability()` との統合準備

**成果物:**

```typescript
// src/app/actions.ts（追加）
export async function getAccessTokenFromRefreshToken(
    refreshToken: string,
): Promise<string>;
```

**🔖 コミットポイント 5:**

```
feat: implement access token generation from refresh token

- Add getAccessTokenFromRefreshToken function
- Call Google OAuth 2.0 token endpoint
- Handle token expiration errors
- Return fresh access token
```

**確認事項:**

- ✅ 新しいアクセストークンが取得できる
- ✅ エラー時の適切なハンドリング
- ✅ トークンの有効期限チェック

---

### ステップ6: ログインページの実装

**目的:** ユーザーが Google アカウントで認証し、Calendar へのアクセスを許可

**タスク:**

- [ ] `src/app/signin/page.tsx` の作成
    - [ ] Google ログインボタン
    - [ ] OAuth フローの開始
    - [ ] ローディング状態の表示
    - [ ] エラー表示
- [ ] `/login` ページとの統合
    - [ ] `/login` から `/signin` へのリダイレクト

**成果物:**

```
src/app/signin/page.tsx
```

**🔖 コミットポイント 6:**

```
feat: add Google sign-in page with Calendar access

- Create sign-in page with Google OAuth
- Request Calendar API scope
- Handle authentication flow
- Redirect to group page after success
```

**確認事項:**

- ✅ Google ログインが正常に動作する
- ✅ Calendar スコープの許可が求められる
- ✅ リフレッシュトークンが保存される

---

### ステップ7: 統合テスト

**目的:** 全体のフローが正常に動作することを確認

**タスク:**

- [ ] エンドツーエンドのテスト
    - [ ] 新規ユーザーでログイン
    - [ ] リフレッシュトークンが保存されることを確認
    - [ ] アクセストークンが生成できることを確認
    - [ ] Calendar API が呼び出せることを確認
- [ ] エラーケースのテスト
    - [ ] トークンが無効な場合
    - [ ] 暗号化キーが間違っている場合
    - [ ] ネットワークエラーの場合

**成果物:**

- テスト結果のドキュメント
- 必要に応じてバグ修正

**🔖 コミットポイント 7:**

```
test: add OAuth flow integration tests

- Test complete authentication flow
- Test token encryption/decryption
- Test access token generation
- Document test results
```

**確認事項:**

- ✅ 全てのエラーケースをカバーしている
- ✅ セキュリティ上の問題がない
- ✅ パフォーマンスに問題がない

---

### ステップ8: Firestore セキュリティルールの設定

**目的:** トークンへの不正アクセスを防ぐ

**タスク:**

- [ ] `firestore.rules` ファイルの作成
    - [ ] users コレクションのルール
    - [ ] 暗号化トークンフィールドの保護
    - [ ] 自分のドキュメントのみアクセス可能
- [ ] Firebase Console でのルール適用
- [ ] ルールのテスト

**成果物:**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
                          && request.auth.uid == userId;

      // トークンフィールドは読み取り不可
      allow read: if request.auth != null
                  && request.auth.uid == userId
                  && !('google_refresh_token_encrypted' in resource.data);
    }
  }
}
```

**🔖 コミットポイント 8:**

```
feat: add Firestore security rules for token protection

- Add rules for users collection
- Protect encrypted token fields
- Allow only authenticated access
- Prevent token field reads from client
```

**確認事項:**

- ✅ クライアントからトークンが読めない
- ✅ Server Action からは読める
- ✅ 他のユーザーのトークンにアクセスできない

---

### ステップ9: ドキュメントとコードのクリーンアップ

**目的:** コードの品質向上とドキュメント整備

**タスク:**

- [ ] コードレビュー
    - [ ] コメントの追加
    - [ ] 不要なコードの削除
    - [ ] 命名の統一
- [ ] ドキュメント更新
    - [ ] README にセットアップ手順を追加
    - [ ] 環境変数の説明を追加
    - [ ] トラブルシューティングガイド
- [ ] テストの追加
    - [ ] 暗号化関数のユニットテスト

**🔖 コミットポイント 9:**

```
docs: update OAuth implementation documentation

- Add setup instructions
- Document environment variables
- Add troubleshooting guide
- Update implementation status
```

---

## 📊 実装進捗チェックリスト

- [x] ステップ1: 暗号化ライブラリ → コミット 1
- [x] ステップ2: 型定義 → コミット 2
- [ ] ステップ3: OAuth フロー → コミット 3
- [ ] ステップ4: トークン保存 → コミット 4
- [ ] ステップ5: トークン生成 → コミット 5
- [ ] ステップ6: ログインページ → コミット 6
- [ ] ステップ7: 統合テスト → コミット 7
- [ ] ステップ8: セキュリティルール → コミット 8
- [ ] ステップ9: ドキュメント整備 → コミット 9

---

## 🎯 各コミット後の確認項目

### 全てのコミットで確認すること

- [ ] コードが正常にビルドできる
- [ ] 既存のテストが通る
- [ ] ESLint / Prettier エラーがない
- [ ] TypeScript の型エラーがない

### セキュリティチェック（ステップ4, 8）

- [ ] 機密情報がコミットされていない
- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] トークンがログに出力されていない

---

## 🚀 次のステップ

現在: **ステップ2** 完了 → **ステップ3** へ

次の作業:

1. [ ] Google Cloud Console で OAuth クライアント設定
2. [ ] OAuth フローの実装開始
3. [ ] API Routes の作成
