import { useState } from "react";

export default function InvitePage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="w-full mx-auto">
                <div className="flex w-full h-25 bg-gray-300">
                    <h1 className="text-4xl font-bold text-black py-8 ml-10">
                        招待リンク
                    </h1>
                </div>
                <div className="flex w-full h-25 bg-gray-300">
                    <h2 className="text-4xl font-bold text-black py-8 ml-10">
                        以下のリンクを招待者に送付してください
                    </h2>
                    <h2 className="text-4xl font-bold text-black py-8 ml-10 bg-white">
                        https://lablink.app/invite
                    </h2>
                </div>
            </div>
        </main>
    );
}
