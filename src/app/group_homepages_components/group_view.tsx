import React, { useState, useEffect } from 'react';
//import { db } from '/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// メンバーとグループのデータ型を定義
interface Member {
  id: string;
  name: string;
}

interface Group {
  name: string;
  members: string[]; // membersフィールドを追加
}

// GroupViewコンポーネントのプロパティを定義
interface GroupViewProps {
  groupId: string;
}

const GroupView: React.FC<GroupViewProps> = ({ groupId }) => {
  const [groupName, setGroupName] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      setLoading(true);
      setError(null);
      try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = groupSnap.data() as Group;
          setGroupName(groupData.name);

          const memberIds = groupData.members;

          if (memberIds && memberIds.length > 0) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('__name__', 'in', memberIds));
            const userDocs = await getDocs(q);
            const memberList = userDocs.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name,
            }));
            setMembers(memberList);
          } else {
            setMembers([]);
          }
        } else {
          setGroupName('グループが見つかりません');
          setMembers([]);
        }
      } catch (err) {
        console.error("データの取得中にエラーが発生しました:", err);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
  }

  const handleInviteClick = () => {
    alert('招待ボタンがクリックされました。');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', width: '300px' }}>
      <h2>{groupName}</h2>
      <div style={{ marginTop: '20px' }}>
        {members.map(member => (
          <div key={member.id} style={{ marginBottom: '10px' }}>
            <span>{member.name}</span>
          </div>
        ))}
      </div>
      <button
        onClick={handleInviteClick}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          backgroundColor: '#007bff',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        招待
      </button>
    </div>
  );
};

export default GroupView;