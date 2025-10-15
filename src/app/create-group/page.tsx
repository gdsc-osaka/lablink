"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const CreateGroupPage = () => {
    const [groupName, setGroupName] = useState("");

    const handleCreateGroup = () => {
        console.log("グループ作成ボタンが押されました。");
    };

    return (
        <div>
            <h2>グループを作成する</h2>
            <p>グループ名を入力してください</p>
            <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="グループ名"
            />
            <Button onClick={handleCreateGroup}>作成</Button>
        </div>
    );
};

export default CreateGroupPage;
