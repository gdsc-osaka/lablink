"use server";

import { google } from "googleapis";
import { getBaseUrl } from "@/lib/server-url";

export async function generateAuthUrl(state: string) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "Google Client ID or Secret is not configured in environment variables.",
        );
    }

    const baseUrl = await getBaseUrl();
    const redirectUri = `${baseUrl}/auth/callback`;

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
    );

    const scopes = [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
        state: state,
    });

    return authUrl;
}
