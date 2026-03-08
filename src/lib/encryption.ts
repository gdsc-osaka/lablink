import "server-only";

/**
 * トークン暗号化ユーティリティ
 * AES-256-GCM を使用してリフレッシュトークンを暗号化・復号化
 */

import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * 環境変数から暗号化キーを取得
 * 開発環境では .env.local に設定、本番環境では環境変数で設定
 */
function getEncryptionKey(): Buffer {
    const key = process.env.TOKEN_ENCRYPTION_KEY;

    if (!key) {
        throw new Error(
            "TOKEN_ENCRYPTION_KEY is not set in environment variables. " +
                "Please generate a key using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
        );
    }

    if (key.length !== 64) {
        throw new Error(
            "TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
                `Current length: ${key.length}`,
        );
    }

    return Buffer.from(key, "hex");
}

/**
 * トークンを暗号化
 *
 * @param plainText 暗号化したいテキスト（リフレッシュトークン）
 * @returns "iv:encrypted:authTag" 形式の暗号化文字列
 *
 * @example
 * const encrypted = encryptToken("1//0abc123...");
 * // => "a1b2c3d4e5f6...:9876543210abcdef...:1234567890abcdef..."
 */
export function encryptToken(plainText: string): string {
    if (!plainText) {
        throw new Error("Cannot encrypt empty text");
    }

    const key = getEncryptionKey();

    // ランダムな初期化ベクトル (IV) を生成
    // GCMでは12バイトが推奨される
    const iv = crypto.randomBytes(12);

    // 暗号化処理
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    // 認証タグを取得
    const authTag = cipher.getAuthTag().toString("hex");

    // IV と暗号化データ、認証タグを結合して返す
    // フォーマット: "iv:encrypted:authTag"
    return iv.toString("hex") + ":" + encrypted + ":" + authTag;
}

/**
 * トークンを復号化
 *
 * @param encryptedText "iv:encrypted:authTag" 形式の暗号化文字列
 * @returns 復号化されたテキスト（リフレッシュトークン）
 *
 * @example
 * const decrypted = decryptToken("a1b2c3d4e5f6...:9876543210abcdef...:1234567890abcdef...");
 * // => "1//0abc123..."
 */
export function decryptToken(encryptedText: string): string {
    if (!encryptedText) {
        throw new Error("Cannot decrypt empty text");
    }

    const key = getEncryptionKey();

    // IV と暗号化データ（および認証タグ）を分離
    const parts = encryptedText.split(":");

    if (parts.length !== 3) {
        throw new Error(
            'Invalid encrypted token format. Expected format: "iv:encrypted:authTag"',
        );
    }

    try {
        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];
        const authTag = Buffer.from(parts[2], "hex");

        // 復号化処理
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        throw new Error(
            "Failed to decrypt token. The token may be corrupted or the encryption key may be incorrect.",
        );
    }
}

/**
 * 暗号化キーを生成（初回セットアップ用）
 *
 * @returns 64文字の16進数文字列（32バイト）
 *
 * @example
 * // CLI で実行:
 * // node -e "const { generateEncryptionKey } = require('./src/lib/encryption'); console.log('TOKEN_ENCRYPTION_KEY=' + generateEncryptionKey());"
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * 暗号化キーの検証（開発用）
 *
 * @returns 暗号化キーが正しく設定されているか
 */
export function validateEncryptionKey(): boolean {
    try {
        getEncryptionKey();
        return true;
    } catch {
        return false;
    }
}
