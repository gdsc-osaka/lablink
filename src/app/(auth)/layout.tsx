import { requireAuth } from "@/lib/auth/server-auth";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ページのsearchParamsを取得するためにこのレイアウトで処理するのではなく、
    // 各ページで直接requireAuth()を呼び出して対応する
    await requireAuth();

    return <>{children}</>;
}
