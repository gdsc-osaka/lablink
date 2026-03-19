/**
 * 暗号化ライブラリのテスト
 */

vi.mock("server-only", () => ({}));
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

            // 暗号化結果は "iv:encrypted:authTag" の形式
            expect(encrypted).toContain(":");
            const parts = encrypted.split(":");
            expect(parts).toHaveLength(3);
            expect(parts[0]).toHaveLength(24); // IV は12バイト = 24文字（hex）
            expect(parts[1].length).toBeGreaterThan(0);
            expect(parts[2]).toHaveLength(32); // AuthTag は16バイト = 32文字（hex）
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
            expect(() => decryptToken("invalid:format:data:extra")).toThrow(
                'Invalid encrypted token format. Expected format: "iv:encrypted:authTag"',
            );
        });

        it("不正なデータの復号化はエラーを投げる", () => {
            expect(() => decryptToken("invalid_data_without_colon")).toThrow();
        });

        it("改ざんされた暗号文は復号に失敗する", () => {
            const token = "1//0gABCDEF123456789-test-refresh-token";
            const encrypted = encryptToken(token);
            const [iv, ciphertext, tag] = encrypted.split(":");
            // 暗号文の末尾4文字(2バイト)を改ざん
            const tampered = `${iv}:${ciphertext.slice(0, -4)}ffff:${tag}`;

            expect(() => decryptToken(tampered)).toThrow();
        });

        it("改ざんされた認証タグは復号に失敗する", () => {
            const token = "1//0gABCDEF123456789-test-refresh-token";
            const encrypted = encryptToken(token);
            const [iv, ciphertext] = encrypted.split(":");
            // 認証タグをすべて "00" の16バイト(32文字)に改ざん
            const tampered = `${iv}:${ciphertext}:${"00".repeat(16)}`;

            expect(() => decryptToken(tampered)).toThrow();
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
