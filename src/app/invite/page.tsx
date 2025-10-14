import React from "react";

const GroupInvitationScreen: React.FC = () => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                backgroundColor: "#ffffff",
            }}
        >
            <div
                style={{
                    width: "500px",
                    padding: "3rem",
                    backgroundColor: "#e6e6e6",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    border: "1px solid #c0c0c0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <h2
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: "normal",
                        color: "#333",
                        marginBottom: "3rem",
                    }}
                >
                    "原研究室" に招待されています
                </h2>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "90%",
                        gap: "3rem",
                    }}
                >
                    <button
                        style={{
                            flexGrow: 1,
                            padding: "1rem 2rem",
                            borderRadius: "5px",
                            border: "none",
                            backgroundColor: "#4d94ff",
                            color: "white",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                            transition:
                                "background-color 0.2s, box-shadow 0.2s",
                        }}
                    >
                        拒否する
                    </button>
                    <button
                        style={{
                            flexGrow: 1,
                            padding: "1rem 2rem",
                            borderRadius: "5px",
                            border: "none",
                            backgroundColor: "#4d94ff",
                            color: "white",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                            transition:
                                "background-color 0.2s, box-shadow 0.2s",
                        }}
                    >
                        参加する
                    </button>
                </div>
            </div>
        </div>
    );
};

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
