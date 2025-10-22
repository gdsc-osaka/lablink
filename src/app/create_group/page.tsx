import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner"

const CreateGroupPage = () => {
    const [groupName, setGroupName] = useState("");

    const handleCreateGroup = () => {
        <Toaster />
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
            <button onClick={handleCreateGroup}>作成</button>
        </div>
    );
};

export default CreateGroupPage;
