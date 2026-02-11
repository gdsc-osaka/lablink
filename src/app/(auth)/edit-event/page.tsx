import { Suspense } from "react";
import EditEventClient from "./EditEventClient";
import { requireAuth } from "@/lib/auth/server-auth";

export default async function Page() {
    await requireAuth();
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditEventClient />
        </Suspense>
    );
}
