import { isSafeRedirectUrl } from "../url";

describe("isSafeRedirectUrl", () => {
    describe("許可するケース", () => {
        it("通常の相対パス", () => {
            expect(isSafeRedirectUrl("/group")).toBe(true);
        });

        it("クエリパラメータ付きパス", () => {
            expect(isSafeRedirectUrl("/group?groupId=abc")).toBe(true);
        });

        it("複数のクエリパラメータ", () => {
            expect(isSafeRedirectUrl("/invited?token=abc&foo=bar")).toBe(true);
        });

        it("フラグメント付きパス", () => {
            expect(isSafeRedirectUrl("/page#section")).toBe(true);
        });

        it("ネストされたパス", () => {
            expect(isSafeRedirectUrl("/a/b/c")).toBe(true);
        });
    });

    describe("拒否するケース", () => {
        it("null", () => {
            expect(isSafeRedirectUrl(null)).toBe(false);
        });

        it("undefined", () => {
            expect(isSafeRedirectUrl(undefined)).toBe(false);
        });

        it("空文字", () => {
            expect(isSafeRedirectUrl("")).toBe(false);
        });

        it("プロトコル相対URL (//evil.com)", () => {
            expect(isSafeRedirectUrl("//evil.com")).toBe(false);
        });

        it("http スキーム", () => {
            expect(isSafeRedirectUrl("http://evil.com")).toBe(false);
        });

        it("https スキーム", () => {
            expect(isSafeRedirectUrl("https://evil.com")).toBe(false);
        });

        it("スラッシュなしの相対パス", () => {
            expect(isSafeRedirectUrl("evil.com")).toBe(false);
        });

        it("ディレクトリトラバーサル (/../)", () => {
            expect(isSafeRedirectUrl("/path/../secret")).toBe(false);
        });

        it("先頭だけのトラバーサル (/..) ", () => {
            expect(isSafeRedirectUrl("/..")).toBe(false);
        });

        it("ヌルバイトを含む", () => {
            expect(isSafeRedirectUrl("/path\0evil")).toBe(false);
        });
    });

    describe("型ガードとして機能する", () => {
        it("true を返す場合は string 型に絞り込まれる", () => {
            const url: string | null = "/group";
            if (isSafeRedirectUrl(url)) {
                expect(url.startsWith("/")).toBe(true);
            }
        });
    });
});
