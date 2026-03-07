import { Suspense } from "react";
import EditEventClient from "./EditEventClient";
<<<<<<< HEAD

export default function Page() {
=======
import { requireAuth } from "@/lib/auth/server-auth";

export default async function Page() {
    await requireAuth();
>>>>>>> origin/main
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditEventClient />
        </Suspense>
    );
}
