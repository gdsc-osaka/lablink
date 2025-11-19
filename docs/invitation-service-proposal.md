# Invitation Service 実装提案書

## 1. 概要

本提案書は、LabLinkアプリケーションにおける招待機能（Invitation Service）の実装計画を定義します。

### 1.1 目的

ユーザーがグループに他のユーザーを招待し、招待リンクを通じてグループへの参加を可能にする機能を実装します。

### 1.2 現状

| コンポーネント | 状態 | 備考 |
|--------------|------|------|
| ドメインモデル | ✅ 完成 | `src/domain/invitation.ts` |
| Repository | ✅ 完成 | `src/infra/invitation/invitation-repo.ts` |
| Converter | ✅ 完成 | `src/infra/invitation/invitation-converter.ts` |
| Service層 | ❌ 未実装 | - |
| UI（招待生成） | ⚠️ スタブ | `src/app/invite/page.tsx` |
| UI（招待受入） | ⚠️ スタブ | `src/app/invited/page.tsx` |

---

## 2. アーキテクチャ原則

### 2.1 クリーンアーキテクチャの遵守

本実装では、クリーンアーキテクチャの依存関係ルールを厳守します。

```
┌─────────────────────────────────────────┐
│            UI Layer (Presentation)       │
│   src/app/**/*.tsx, src/components/      │
└─────────────────┬───────────────────────┘
                  │ 依存
                  ▼
┌─────────────────────────────────────────┐
│           Service Layer (Use Cases)      │
│              src/service/                │
└─────────────────┬───────────────────────┘
                  │ 依存
                  ▼
┌─────────────────────────────────────────┐
│            Domain Layer (Entities)       │
│              src/domain/                 │
└─────────────────────────────────────────┘
                  ▲
                  │ 実装
┌─────────────────┴───────────────────────┐
│       Infrastructure Layer (Adapters)    │
│              src/infra/                  │
└─────────────────────────────────────────┘
```

### 2.2 依存関係ルール

- **UI層**: Service層のみに依存。Infra層を直接呼び出さない
- **Service層**: Domain層のインターフェースに依存
- **Infra層**: Domain層のインターフェースを実装
- **Domain層**: 他の層に依存しない（最も内側）

### 2.3 依存性注入

UI層からService層を利用する際は、依存性注入パターンを使用：

```typescript
// UI層での使用例
import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { FirestoreGroupRepository } from "@/infra/group/group-repo";
import { FirestoreUserGroupRepository } from "@/infra/group/user-group-repository";

// Service層を通じてのみアクセス
const invitationService = createInvitationService(
    invitationRepo,
    new FirestoreGroupRepository(),
    new FirestoreUserGroupRepository()
);

// ❌ NG: UI層から直接Infra層を呼び出す
// const result = await invitationRepo.create(invitation);

// ✅ OK: Service層を経由
// const result = await invitationService.createInvitation(groupId);
```

---

## 3. 実装タスク一覧

### Phase 1: コア機能（Service層）

| # | タスク | 優先度 | 依存 |
|---|-------|-------|------|
| 1.1 | InvitationService の作成 | 高 | - |
| 1.2 | トークン生成ユーティリティ | 高 | - |
| 1.3 | Service Factory / DI設定 | 高 | 1.1 |

### Phase 2: UI統合（既存UIへのService層統合）

| # | タスク | 優先度 | 依存 |
|---|-------|-------|------|
| 2.1 | 招待リンク生成画面へのService統合 | 高 | 1.1 |
| 2.2 | 招待受入画面へのService統合 | 高 | 1.1 |
| 2.3 | グループ一覧の招待ボタン機能追加 | 中 | 2.1 |

### Phase 3: 拡張機能

| # | タスク | 優先度 | 依存 |
|---|-------|-------|------|
| 3.1 | 招待リンクのコピー機能 | 中 | 2.1 |
| 3.2 | 招待の有効期限管理 | 中 | 1.1 |
| 3.3 | 招待履歴の表示 | 低 | 1.1 |
| 3.4 | 招待の取り消し機能 | 低 | 1.1 |

---

## 4. 詳細設計

### 4.1 InvitationService

**ファイル:** `src/service/invitation-service.ts`

```typescript
import { ResultAsync } from "neverthrow";
import { Invitation, InvitationRepository } from "@/domain/invitation";
import { DBError, NotFoundError } from "@/domain/error";
import { Group } from "@/domain/group";

export interface InvitationService {
    // 招待を作成
    createInvitation(
        groupId: string,
        expiresInDays?: number
    ): ResultAsync<Invitation, DBError>;

    // トークンで招待を検証
    validateInvitation(
        token: string
    ): ResultAsync<Invitation, DBError | NotFoundError | ExpiredError>;

    // 招待を受け入れてグループに参加
    acceptInvitation(
        token: string,
        userId: string
    ): ResultAsync<void, DBError | NotFoundError | ExpiredError>;
}

export interface ExpiredError {
    type: "ExpiredError";
    message: string;
}

export function createInvitationService(
    invitationRepo: InvitationRepository,
    groupRepo: GroupRepository,
    userGroupRepo: UserGroupRepository
): InvitationService {
    return {
        createInvitation: (groupId, expiresInDays = 7) => {
            const invitation: Invitation = {
                id: crypto.randomUUID(),
                groupId,
                token: generateToken(),
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
            };
            return invitationRepo.create(invitation);
        },

        validateInvitation: (token) => {
            return invitationRepo.findByToken(token).andThen((invitation) => {
                if (new Date() > invitation.expiresAt) {
                    return errAsync({
                        type: "ExpiredError",
                        message: "招待リンクの有効期限が切れています",
                    });
                }
                return okAsync(invitation);
            });
        },

        acceptInvitation: (token, userId) => {
            // 1. 招待を検証
            // 2. グループ情報を取得
            // 3. UserGroupRepository.addMember() でメンバー追加
        },
    };
}

function generateToken(): string {
    return crypto.randomUUID().replace(/-/g, "");
}
```

---

### 4.2 UI層からの呼び出し例

既存のUI（`src/app/invite/page.tsx`、`src/app/invited/page.tsx`）は変更せず、以下のようにService層を呼び出します。

```typescript
// UI層での使用例
import { createInvitationService } from "@/service/invitation-service";
import { invitationRepo } from "@/infra/invitation/invitation-repo";
import { FirestoreGroupRepository } from "@/infra/group/group-repo";
import { FirestoreUserGroupRepository } from "@/infra/group/user-group-repository";

// Service層を経由してアクセス
const invitationService = createInvitationService(
    invitationRepo,
    new FirestoreGroupRepository(),
    new FirestoreUserGroupRepository()
);

// 招待作成
const result = await invitationService.createInvitation(groupId);

// 招待検証
const validateResult = await invitationService.validateInvitation(token);

// 招待受入
const acceptResult = await invitationService.acceptInvitation(token, userId);
```

### 4.3 エラー型定義

**ファイル:** `src/domain/error.ts` に追加

```typescript
export interface ExpiredError {
    type: "ExpiredError";
    message: string;
}
```

---

## 5. データフロー

### 5.1 招待作成フロー

```
[ユーザー] → [招待ボタンクリック]
    ↓
[/invite?groupId=xxx] → [UI層]
    ↓
[InvitationService.createInvitation] ← Service層
    ↓
[invitationRepo.create] ← Infra層 → [Firestore: invitations/{id}]
    ↓
[招待URL生成] → [UIに表示]
```

### 5.2 招待受入フロー

```
[招待されたユーザー] → [招待リンクをクリック]
    ↓
[/invited?token=xxx] → [UI層]
    ↓
[InvitationService.validateInvitation] ← Service層
    ↓
[グループ情報表示] → [参加ボタンクリック]
    ↓
[InvitationService.acceptInvitation] ← Service層
    ↓
[UserGroupRepository.addMember] ← Infra層
    ↓
    ├─ [Firestore: groups/{groupId}/users/{userId}]
    └─ [Firestore: users/{userId}/groups/{groupId}]
    ↓
[グループページへリダイレクト]
```

---

## 6. Firestore データ構造

### 6.1 invitations コレクション

```
invitations/{invitationId}
├── id: string
├── groupId: string
├── token: string
├── createdAt: Timestamp
└── expiresAt: Timestamp
```

> **Note:** `findByToken` は単一フィールドの等価クエリ（`where("token", "==", value)`）のため、Firestoreの自動インデックスが適用されます。手動でのインデックス設定は不要です。

---

## 7. セキュリティ考慮事項

### 7.1 認証・認可

- 招待作成: グループのオーナーまたはメンバーのみ許可
- 招待受入: 認証済みユーザーのみ許可

### 7.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /invitations/{invitationId} {
      // 認証済みユーザーのみ読み取り可能
      allow read: if request.auth != null;

      // グループメンバーのみ作成可能
      allow create: if request.auth != null
        && exists(/databases/$(database)/documents/groups/$(request.resource.data.groupId)/users/$(request.auth.uid));

      // 削除は作成者またはグループオーナーのみ
      allow delete: if request.auth != null
        && exists(/databases/$(database)/documents/groups/$(resource.data.groupId)/users/$(request.auth.uid));
    }
  }
}
```

### 7.3 トークンセキュリティ

- トークンは推測困難なランダム文字列（UUID v4）
- 有効期限を設定（デフォルト7日）
- 使用回数制限は Phase 3 で検討

---

## 8. テスト計画

### 8.1 ユニットテスト

| テスト対象 | テスト内容 |
|-----------|----------|
| `generateToken` | トークン形式、ユニーク性 |
| `InvitationService.createInvitation` | 正常作成、エラーハンドリング |
| `InvitationService.validateInvitation` | 有効/無効/期限切れ判定 |
| `InvitationService.acceptInvitation` | グループ参加処理 |

### 8.2 統合テスト

| テスト対象 | テスト内容 |
|-----------|----------|
| 招待作成フロー | UI → Service → Repository |
| 招待受入フロー | URL → 検証 → 参加 → リダイレクト |

### 8.3 E2Eテスト

- 招待リンク生成からグループ参加までの一連のフロー
- 期限切れリンクのエラー表示
- 未認証ユーザーのリダイレクト

---

## 9. 環境変数

```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 本番環境
NEXT_PUBLIC_APP_URL=https://lablink.app
```

---

## 10. 実装スケジュール

### Phase 1: コア機能
- InvitationService 実装
- Service Factory / DI設定
- 基本的なエラーハンドリング

### Phase 2: UI統合
- 既存の招待リンク生成画面へのService統合
- 既存の招待受入画面へのService統合
- グループ一覧の招待ボタン機能追加

### Phase 3: 拡張機能
- クリップボードコピー
- 有効期限カスタマイズ
- 招待履歴管理

---

## 11. 今後の検討事項

1. **招待の使用回数制限**: 1回限りの招待リンク
2. **ロール指定**: 招待時にメンバー/管理者を選択
3. **メール招待**: メールアドレス直接入力での招待
4. **QRコード生成**: 招待リンクのQRコード表示
5. **招待の承認フロー**: オーナーによる参加承認

---

## 付録: 関連ファイル一覧

| ファイル | 状態 | 役割 |
|---------|------|------|
| `src/domain/invitation.ts` | 既存 | ドメインモデル |
| `src/domain/group.ts` | 既存 | グループモデル |
| `src/infra/invitation/invitation-repo.ts` | 既存 | Repository実装 |
| `src/infra/invitation/invitation-converter.ts` | 既存 | Converter |
| `src/infra/group/user-group-repository.ts` | 既存 | メンバー追加 |
| `src/service/invitation-service.ts` | **新規** | サービス層 |
| `src/app/actions/invitation.ts` | **新規** | Server Actions |
| `src/app/invite/page.tsx` | 修正 | 招待生成UI |
| `src/app/invited/page.tsx` | 修正 | 招待受入UI |
| `src/app/group/_components/group-list.tsx` | 修正 | 招待ボタン |
