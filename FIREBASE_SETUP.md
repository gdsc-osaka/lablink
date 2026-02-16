# Firebase セットアップガイド

Geminiのレポートに基づいて、Firebaseのセットアップを完了するための手順を説明します。

## 📋 準備したファイル

- ✅ [firestore.rules](firestore.rules) - Firestoreセキュリティルール
- ✅ [scripts/seed-firestore.json](scripts/seed-firestore.json) - テストデータ
- ✅ [scripts/seed-firestore.ts](scripts/seed-firestore.ts) - データ投入スクリプト

## 🚀 セットアップ手順

### 1. Firestoreセキュリティルールのデプロイ

Firebase Consoleで手動デプロイする場合：

1. [Firebase Console](https://console.firebase.google.com) を開く
2. プロジェクト「lablink」を選択
3. 左メニューから「Firestore Database」を選択
4. 「ルール」タブをクリック
5. [firestore.rules](firestore.rules) の内容をコピー＆ペースト
6. 「公開」ボタンをクリック

または、Firebase CLIでデプロイ：

```bash
firebase deploy --only firestore:rules
```

### 2. テストデータの投入

以下のコマンドを実行してテストデータをFirestoreに投入します：

```bash
pnpm seed
```

このコマンドは以下を作成します：

**ユーザー:**
- `user1_id` (user1@example.com) - 2つのグループのオーナー
- `user2_id` (user2@example.com) - GDGoC osakaのメンバー
- `user3_id` (user3@example.com) - GDGoC osakaのメンバー

**グループ:**
- `haraken_group_id` (原研) - user1がオーナー
- `gdgoc_group_id` (GDGoC osaka) - user1がオーナー、user2/user3がメンバー

**イベント (GDGoC osaka):**
- `event_koryukai_id` (交流会) - 2025-05-12 13:00-16:00
- `event_meeting_id` (ミーティング) - 2025-05-23 11:00-12:00

### 3. Firebase Authenticationでテストユーザーを作成

Firestoreのデータとは別に、Firebase Authenticationでテストユーザーを作成する必要があります：

1. Firebase Console → Authentication → Users
2. 「ユーザーを追加」をクリック
3. 以下のユーザーを作成：
   - Email: `user1@example.com` / UID: `user1_id`を指定
   - Email: `user2@example.com` / UID: `user2_id`を指定
   - Email: `user3@example.com` / UID: `user3_id`を指定

⚠️ **重要**: Authenticationの **UID** と Firestoreのドキュメント ID を一致させてください。

### 4. 動作確認

1. アプリを起動：
   ```bash
   pnpm dev
   ```

2. `user1@example.com` でログイン

3. `/group` ページで以下を確認：
   - 左サイドバーに「原研」と「GDGoC osaka」が表示される
   - 「GDGoC osaka」を選択すると、右側に2つのイベントが表示される

## 📊 データ構造

```
/users/{userId}
  - email, created_at, updated_at
  /groups/{groupId} (インデックス)
    - name, createdAt, updatedAt, joinedAt

/groups/{groupId}
  - name, createdAt, updatedAt
  /users/{userId}
    - role, joinedAt
  /events/{eventId}
    - title, description, begin_at, end_at, created_at, updated_at
```

## 🔒 セキュリティルールの要点

- ✅ 認証済みユーザーのみアクセス可能
- ✅ グループメンバーのみグループ情報を閲覧可能
- ✅ グループオーナーのみ更新・削除可能
- ✅ イベントはメンバー全員が閲覧、オーナーのみ編集可能
- ✅ ユーザーは自分の情報のみ閲覧・更新可能

## ⚠️ 既知の制限

- **メンバー一覧**: 現在UIではメンバーが空配列で表示されます（将来的にFirebaseから取得予定）
- **イベント取得エラー**: グループにイベントがない場合はエラーになります（空配列を返すように修正可能）

## 🛠️ トラブルシューティング

### データ投入エラー

```bash
# 環境変数が読み込まれているか確認
echo $NEXT_SERVICE_ACCOUNT_JSON
```

### セキュリティルールエラー

Firebase Consoleの「ルール」タブで構文エラーを確認してください。

### 認証エラー

FirebaseコンソールでAuthenticationのユーザーUIDとFirestoreのドキュメントIDが一致しているか確認してください。
