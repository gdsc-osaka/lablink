import "server-only";
import { headers } from "next/headers";

/**
 * サーバーサイド環境で現在のリクエスト情報に基づくベースURLを取得する
 * 環境変数を優先し、ヘッダーの偽装リスクを軽減しつつ
 * Vercelのプレビュー環境などでオリジンが動的に変わる問題に対応します
 */
export async function getBaseUrl(): Promise<string> {
    // 明示的な環境変数 (APP_BASE_URL) を最優先
    if (process.env.APP_BASE_URL) {
        return process.env.APP_BASE_URL;
    }

    // ローカル開発環境や、その他の環境でのフォールバックとしてヘッダーを使用
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const forwardedProto = headersList.get("x-forwarded-proto");

    // リバースプロキシ環境でのプロトコルを優先し、ない場合はlocalhostでhttp、他はhttpsと判定
    const protocol =
        forwardedProto || (host.includes("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
}
