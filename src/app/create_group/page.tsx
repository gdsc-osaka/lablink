import { useState } from "react";

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
            <button onClick={handleCreateGroup}>作成</button>
        </div>
    );
};

export default CreateGroupPage;
