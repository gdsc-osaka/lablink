/**
 * 暗号化ライブラリのテスト
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
    encryptToken,
    decryptToken,
    validateEncryptionKey,
} from "../encryption";

describe("Encryption Library", () => {
    beforeAll(() => {
        // テスト用の暗号化キーを設定（実際には .env.local から読み込まれる）
        if (!process.env.TOKEN_ENCRYPTION_KEY) {
            // テスト環境用のダミーキー（64文字の16進数）
            process.env.TOKEN_ENCRYPTION_KEY =
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        }
    });

    describe("validateEncryptionKey", () => {
        it("暗号化キーが設定されている場合、true を返す", () => {
            expect(validateEncryptionKey()).toBe(true);
        });
    });

    describe("encryptToken", () => {
        it("トークンを正常に暗号化できる", () => {
            const testToken = "1//0gABCDEF123456789-test-refresh-token";
            const encrypted = encryptToken(testToken);

            // 暗号化結果は "iv:encrypted" の形式
            expect(encrypted).toContain(":");
            const parts = encrypted.split(":");
            expect(parts).toHaveLength(2);
            expect(parts[0]).toHaveLength(32); // IV は16バイト = 32文字（hex）
            expect(parts[1].length).toBeGreaterThan(0);
        });

        it("同じトークンでも異なる暗号化結果になる（IV が異なる）", () => {
            const testToken = "1//0gABCDEF123456789-test-refresh-token";
            const encrypted1 = encryptToken(testToken);
            const encrypted2 = encryptToken(testToken);

            expect(encrypted1).not.toBe(encrypted2);
        });

        it("空文字列の暗号化はエラーを投げる", () => {
            expect(() => encryptToken("")).toThrow("Cannot encrypt empty text");
        });
    });

    describe("decryptToken", () => {
        it("暗号化したトークンを正常に復号化できる", () => {
            const testToken = "1//0gABCDEF123456789-test-refresh-token";
            const encrypted = encryptToken(testToken);
            const decrypted = decryptToken(encrypted);

            expect(decrypted).toBe(testToken);
        });

        it("複雑なトークンも正常に復号化できる", () => {
            const complexToken =
                "1//0abc-DEF_123/456/789+special=chars~!@#$%^&*()";
            const encrypted = encryptToken(complexToken);
            const decrypted = decryptToken(encrypted);

            expect(decrypted).toBe(complexToken);
        });

        it("空文字列の復号化はエラーを投げる", () => {
            expect(() => decryptToken("")).toThrow("Cannot decrypt empty text");
        });

        it("不正なフォーマットの復号化はエラーを投げる", () => {
            expect(() => decryptToken("invalid:format:data")).toThrow(
                "Failed to decrypt token",
            );
        });

        it("不正なデータの復号化はエラーを投げる", () => {
            expect(() => decryptToken("invalid_data_without_colon")).toThrow();
        });
    });

    describe("暗号化・復号化のラウンドトリップテスト", () => {
        const testCases = [
            "1//0abc123",
            "short",
            "a".repeat(1000), // 長い文字列
            "日本語トークン",
            "🔐 emoji token 🎉",
            "with\nnewlines\nand\ttabs",
        ];

        testCases.forEach((testToken) => {
            it(`"${testToken.substring(0, 20)}..." のラウンドトリップ`, () => {
                const encrypted = encryptToken(testToken);
                const decrypted = decryptToken(encrypted);
                expect(decrypted).toBe(testToken);
            });
        });
    });
});
