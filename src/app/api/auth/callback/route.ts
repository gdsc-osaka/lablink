import { NextRequest, NextResponse } from "next/server";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/firebase/client";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { encryptToken } from "@/lib/encryption";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // エラーハンドリング
    if (error) {
        console.error("OAuth error:", error);
        return NextResponse.redirect(
            new URL(`/signin?error=${encodeURIComponent(error)}`, request.url),
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL("/signin?error=no_code", request.url),
        );
    }

    try {
        // 1. Authorization Code を Access Token と Refresh Token に交換
        const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    code,
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                    redirect_uri: `${request.nextUrl.origin}/api/auth/callback`,
                    grant_type: "authorization_code",
                }),
            },
        );

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Token exchange failed:", errorText);
            throw new Error("Failed to exchange authorization code");
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token, id_token } = tokens;

        if (!refresh_token) {
            console.warn("No refresh token received. User may have already authorized.");
        }

        // 2. Firebase Auth にログイン（ID Token を使用）
        const credential = GoogleAuthProvider.credential(id_token, access_token);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        // 3. リフレッシュトークンを暗号化して Firestore に保存
        if (refresh_token) {
            const encryptedRefreshToken = encryptToken(refresh_token);

            const userRef = doc(db, "users", user.uid);
            await setDoc(
                userRef,
                {
                    email: user.email,
                    google_refresh_token_encrypted: encryptedRefreshToken,
                    google_token_expires_at: Timestamp.now(),
                    updated_at: Timestamp.now(),
                    created_at: Timestamp.now(),
                },
                { merge: true },
            );

            console.log(
                `Refresh token saved for user: ${user.uid} (${user.email})`,
            );
        }

        // 4. ホームページにリダイレクト
        return NextResponse.redirect(new URL("/", request.url));
    } catch (err) {
        console.error("OAuth callback error:", err);
        return NextResponse.redirect(
            new URL(
                `/signin?error=${encodeURIComponent("authentication_failed")}`,
                request.url,
            ),
        );
    }
}
