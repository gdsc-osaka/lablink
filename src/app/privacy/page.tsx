import Link from 'next/link';

export default function PrivacyPolicy() {
    const APP_NAME = "lablink";
    const CONTACT_EMAIL = "sakura412629@gmail.com";
    const DEVELOPER_NAME = "gdgoc-osaka";

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <main className="max-w-3xl mx-auto bg-white shadow-sm rounded-xl p-8 sm:p-12 border border-gray-100">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8 pb-4 border-b border-gray-200">
                    プライバシーポリシー
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    {APP_NAME}（以下、「当アプリ」といいます。）は、ユーザーの個人情報の保護を重要視し、以下の通りプライバシーポリシーを定めます。
                </p>

                <div className="space-y-8 text-gray-800">
                    {/* 第1項 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            1. 収集する情報および利用目的
                        </h2>
                        <p className="mb-3 leading-relaxed">
                            当アプリでは、提供する機能の実現のために以下の情報を取得・利用します。
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li>
                                <strong className="text-gray-900">Googleアカウントの基本情報（識別子、氏名、メールアドレス、プロフィール画像）</strong>
                                <br />
                                <span className="text-sm text-gray-600">【利用目的】ユーザーの識別、認証、およびアカウント管理のため。</span>
                            </li>
                            <li>
                                <strong className="text-gray-900">Googleカレンダーのデータ（予定の読み取り権限）</strong>
                                <br />
                                <span className="text-sm text-gray-600">
                                    【利用目的】当アプリ内でのスケジュール調整機能の提供のため。
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* 第2項 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            2. Googleユーザーデータの限定的利用について
                        </h2>
                        <p className="leading-relaxed">
                            当アプリがGoogle APIから受け取った情報の使用および他のアプリへの転送は、
                            <Link
                                href="https://developers.google.com/terms/api-services-user-data-policy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center"
                            >
                                Google APIサービスのユーザーデータに関するポリシー
                            </Link>
                            （限定的利用要件を含む）に準拠します。ユーザーの同意なく、カレンダーデータを第三者に提供したり、広告配信などの目的で利用することは一切ありません。
                        </p>
                    </section>

                    {/* 第3項 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            3. データの保存とセキュリティ
                        </h2>
                        <p className="leading-relaxed">
                            当アプリが取得したGoogleカレンダーのデータは、ユーザーのブラウザおよび端末内でのみ処理され、当アプリのサーバーには保存されません。
                        </p>
                    </section>

                    {/* 第4項 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            4. データの削除および連携解除
                        </h2>
                        <p className="leading-relaxed">
                            ユーザーは、当アプリ内の設定、またはGoogleアカウントの「セキュリティ」設定にある「サードパーティ製のアプリとサービス」から、いつでも当アプリとの連携を解除し、データのアクセス権を取り消すことができます。また、ユーザーからデータの削除要請があった場合、速やかに適切な措置を講じます。
                        </p>
                    </section>

                    {/* 第5項 */}
                    <section className="pt-6 border-t border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            5. お問い合わせ
                        </h2>
                        <p className="mb-2 leading-relaxed">
                            本ポリシーに関するお問い合わせ、または個人情報の取り扱いに関するご質問は、以下の連絡先までご連絡ください。
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
                            <p><span className="font-medium text-gray-900">担当者/組織名:</span> {DEVELOPER_NAME}</p>
                            <p>
                                <span className="font-medium text-gray-900">連絡先メールアドレス:</span>{' '}
                                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                                    {CONTACT_EMAIL}
                                </a>
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}