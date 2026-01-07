import { requireAuth } from '@/lib/auth/server-auth';

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuth();

    return <>{children}</>;
}