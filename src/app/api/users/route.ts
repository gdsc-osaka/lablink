import { NextResponse } from 'next/server';

// テスト用の静的ユーザー一覧
const users = [
  { id: '1', username: 'alice', email: 'alice@example.com' },
  { id: '2', username: 'bob', email: 'bob@example.com' },
  { id: '3', username: 'charlie', email: 'charlie@example.com' },
  { id: '4', username: 'daisuke', email: 'daisuke@example.com' },
  { id: '5', username: 'emily', email: 'emily@example.com' },
];

export async function GET() {
  return NextResponse.json(users);
}
