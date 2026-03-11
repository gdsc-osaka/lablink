import "server-only";
import { headers } from "next/headers";

/**
 * サーバーサイド環境で現在のリクエスト情報に基づくベースURLを取得する
 * Vercelのプレビュー環境などでオリジンが動的に変わる問題に対応します
 */
export async function getBaseUrl(): Promise<string> {
    const headersList = await headers();
    const host = headersList.get("host");
    const forwardedProto = headersList.get("x-forwarded-proto");

    // x-forwarded-proto リバースプロキシ環境でのプロトコルを優先し、ない場合はlocalhostでhttp、他はhttpsと判定
    const protocol =
        forwardedProto || (host?.includes("localhost") ? "http" : "https");

    return `${protocol}://${host || "localhost:3000"}`;
}
