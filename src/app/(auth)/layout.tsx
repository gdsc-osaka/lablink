<<<<<<< HEAD
import { requireAuth } from "@/lib/auth/server-auth";

=======
>>>>>>> origin/main
export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
<<<<<<< HEAD
    await requireAuth();

=======
>>>>>>> origin/main
    return <>{children}</>;
}
