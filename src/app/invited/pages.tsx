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

export default GroupInvitationScreen;
