import { useState } from 'react';
import { useRouter } from 'next/router';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from 'C:/Users/sakur/lablink/src/firebase/firestore';
import { useAuth } from 'C:/Users/sakur/lablink/src/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const CreateGroupPage = () => {
  const [groupName, setGroupName] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleCreateGroup = async () => {
    if (!user || !groupName) return;

    try {
      // グループデータを作成
      const newGroupRef = await addDoc(collection(firestore, 'groups'), {
        name: groupName,
        ownerId: user.uid,
        createdAt: new Date(),
      });
      const groupId = newGroupRef.id;

      // 招待リンク用のデータをFirestoreに保存
      const invitationToken = uuidv4(); // 一意のトークンを生成
      const invitationRef = await addDoc(collection(firestore, 'invitations'), {
        groupId: groupId,
        token: invitationToken,
        createdAt: new Date(),
      });

      // 成功したらグループページにリダイレクト
      // クエリパラメータにgroupIdを渡す
      router.push(`/group/${groupId}`);
    } catch (error) {
      console.error('Error creating group or invitation link:', error);
    }
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