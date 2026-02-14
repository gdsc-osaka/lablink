
/**
 * リダイレクト先URLが安全な相対パスかどうかを検証
 * オープンリダイレクト脆弱性を防ぐため、外部サイトへのリダイレクト（//やhttpで始まるもの）を拒否
 * 
 * @param url 検証するURL
 * @returns 安全な相対パスの場合はtrue
 */
export const isSafeRedirectUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // スラッシュで始まらない場合は相対パスではない（または絶対URL）
    if (!url.startsWith("/")) return false;
    // スラッシュ2つで始まる場合はプロトコル相対URL（例: //example.com）の可能性があるため拒否
    if (url.startsWith("//")) return false;

    return true;
};
