"use server";

import { signIn } from "@/auth";

export async function loginWithGoogle(redirectTo?: string | null) {
    await signIn("google", { redirectTo: redirectTo || "/group" });
}
