# Geminiに投げるプロンプト

以下の内容をFirebase Geminiに貼り付けてください：

---

## 依頼内容

私のNext.js + Firebaseプロジェクトのディレクトリ構成を分析し、以下のレポートを作成してください：

1. **必要なFirestoreコレクション構造の確認**
2. **テスト用サンプルデータの生成（JSON形式）**
3. **Firestoreセキュリティルールの提案**
4. **必要なFirestoreインデックスの提案**

## プロジェクト情報

### 技術スタック
- Next.js 15 (App Router)
- Firebase/Firestore
- TypeScript
- neverthrow（Result型を使用）

### ドメインモデル

#### Group（グループ）
```typescript
interface Group {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
```

#### UserGroup（ユーザー-グループ関連）
```typescript
interface UserGroup {
    groupId: string;
    userId: string;
    role: "owner" | "member";
    joinedAt: Date;
}
```

#### Event（イベント）
```typescript
interface Event {
    id: string;
    title: string;
    description: string;
    begin_at: Timestamp;
    end_at: Timestamp;
    created_at?: Date;
    updated_at?: Date;
}
```

#### User（ユーザー）
```typescript
interface User {
    email: string;
    created_at: Timestamp;
    updated_at: Timestamp;
}
```

### 現在のリポジトリ実装が期待するFirebaseパス

#### GroupRepository
- `groups/{groupId}` - グループ情報
- ドキュメントフィールド: `name`, `createdAt`, `updatedAt`

#### UserGroupRepository
- `users/{userId}/groups/{groupId}` - ユーザーが所属するグループのインデックス
  - フィールド: `name`, `createdAt`, `updatedAt`, `joinedAt`
- `groups/{groupId}/users/{userId}` - グループメンバーのインデックス
  - フィールド: `role`, `joinedAt`

#### EventRepository
- `groups/{groupId}/events/{eventId}` - グループ配下のイベント
- ドキュメントフィールド: `title`, `description`, `begin_at`, `end_at`, `created_at`, `updated_at`

#### UserRepository
- `users/{userId}` - ユーザープロフィール
- ドキュメントフィールド: `email`, `created_at`, `updated_at`

### 主なクエリパターン

1. **ユーザーが所属する全グループを取得**
   ```typescript
   collection(db, "users", userId, "groups")
   ```

2. **グループの全イベントを取得**
   ```typescript
   query(
     collection(db, "groups", groupId, "events"),
     orderBy("created_at", "desc")
   )
   ```

3. **グループの全メンバーIDを取得**
   ```typescript
   collection(db, "groups", groupId, "users")
   ```

## 求めるアウトプット

### 1. テストデータ（JSON形式）
以下のシナリオに対応するテストデータを生成してください：

**ユーザー:**
- user1@example.com（オーナー）
- user2@example.com（メンバー）
- user3@example.com（メンバー）

**グループ:**
- "原研"（user1がオーナー、メンバーなし）
- "GDGoC osaka"（user1がオーナー、user2, user3がメンバー）

**イベント（GDGoC osakaに属する）:**
- "交流会" - 2025-05-12 13:00 ～ 16:00
- "ミーティング" - 2025-05-23 11:00 ～ 12:00

### 2. Firestoreセキュリティルール
以下の要件を満たすルールを提案してください：
- 認証済みユーザーのみアクセス可能
- グループは所属メンバーのみ読み取り可能
- グループの作成者（owner）のみ更新・削除可能
- イベントはグループメンバー全員が読み取り可能、ownerのみ作成・更新・削除可能
- ユーザーは自分の情報のみ読み取り・更新可能

### 3. Firestoreインデックス
上記のクエリパターンに必要な複合インデックスを提案してください（もしあれば）。

### 4. セットアップ手順
Firebase Consoleでのデータ作成手順を簡潔に説明してください。

---

## 補足情報

- 現在Firestoreには雑多なテストデータがあるが、体系的なテストデータはない
- セキュリティルールは未設定
- インデックスは未設定
- Firebase認証はGoogle認証を使用中

## 期待するレポート形式

マークダウン形式で、以下のセクションを含めてください：
1. コレクション構造図
2. テストデータ（コピペ可能なJSON）
3. セキュリティルール（コピペ可能なfirestore.rules）
4. インデックス設定（コピペ可能なfirestore.indexes.json）
5. セットアップ手順

よろしくお願いします。
