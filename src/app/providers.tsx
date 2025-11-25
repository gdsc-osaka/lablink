"use client";

import { AuthProvider } from "@/provider/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
