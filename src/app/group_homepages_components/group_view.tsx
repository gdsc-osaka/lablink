"use client"

import { Autour_One } from 'next/font/google';
import React from 'react';

// メンバーとグループのデータ型を定義
export interface Member {
  id: string;
  name: string;
  iconUrl?: string;
}



export interface Group     {
  name: string;
  members: Member[]; // membersフィールドを追加
}


// GroupViewコンポーネントのプロパティを定義
interface GroupViewProps {
  group: Group;
}

const GroupView: React.FC<GroupViewProps> = ({ group }) => {

  const handleInviteClick = () => {
    alert('招待ボタンがクリックされました。');
  };

  return (<div style={{display:'flex',height:'100%'}}>
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', width: '200px' , height: '100%', display:'flex', flexDirection:'column'}}>
      <h2 style={{fontWeight:'bold', fontSize:'100%' ,textAlign:'center'}}>{group.name}</h2>
      <div style={{ marginTop: '20px' }}>
        {group.members.map((member:Member) => (
          <div key={member.id} style={{ marginBottom: '10px' }}>
            <span>{member.name}</span>
          </div>
        ))}
      </div>
      <button
        onClick={handleInviteClick}
        style={{
          marginTop: 'auto',
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
    <div style ={{width:'100%',backgroundColor:'#ece5ad7a'}}></div>
    </div>
  );
};

export default GroupView;