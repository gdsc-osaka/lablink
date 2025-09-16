'use client';

import { useRouter } from 'next/navigation';

export default function EventCompletePage() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="flex w-full h-25 bg-gray-300">
        <h1 className="text-4xl font-bold text-black py-8 ml-10">
          イベント作成完了
        </h1>
      </div>

      {/* メインコンテンツ */}
      <div className="p-6">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              イベントが正常に作成されました
            </h2>
            <p className="text-gray-600">
              選択された日程でイベントが作成されました。
            </p>
          </div>

          <button
            onClick={handleBackToHome}
            className="bg-blue-500 text-white px-8 py-3 rounded hover:bg-blue-600"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
