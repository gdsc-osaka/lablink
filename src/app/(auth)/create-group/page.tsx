import { requireAuth } from "@/lib/auth/server-auth";
import CreateGroupClient from "./CreateGroupClient";

export default async function CreateGroupPage() {
    await requireAuth();
    return <CreateGroupClient />;
}
