import Link from 'next/link';

export default function TermsOfService() {
    const APP_NAME = "lablink"; // TODO: GCPに登録したアプリ名
    const CONTACT_EMAIL = "sakura412629@gmail.com"; // TODO: GCPのサポートメール
    const DEVELOPER_NAME = "gdgoc-osaka"; // TODO: ご自身の名前など

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <main className="max-w-3xl mx-auto bg-white shadow-sm rounded-xl p-8 sm:p-12 border border-gray-100">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8 pb-4 border-b border-gray-200">
                    利用規約
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    この利用規約（以下、「本規約」といいます。）は、{DEVELOPER_NAME}（以下、「当方」といいます。）が提供するアプリケーション「{APP_NAME}」（以下、「本サービス」といいます。）の利用条件を定めるものです。利用者の皆様（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
                </p>

                <div className="space-y-8 text-gray-800">
                    {/* 第1条 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            第1条（適用）
                        </h2>
                        <p className="leading-relaxed">
                            本規約は、ユーザーと当方との間の本サービスの利用に関わる一切の関係に適用されるものとします。ユーザーは、本サービスを利用することにより、本規約のすべての内容に同意したものとみなされます。
                        </p>
                    </section>

                    {/* 第2条 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            第2条（利用登録と認証）
                        </h2>
                        <p className="leading-relaxed">
                            ユーザーは、Googleアカウントを用いた認証を行うことで、本サービスを利用することができます。ユーザーは、自身のGoogleアカウントおよびログイン情報の管理について一切の責任を負うものとします。
                        </p>
                    </section>

                    {/* 第3条 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            第3条（Googleカレンダーデータの利用）
                        </h2>
                        <p className="leading-relaxed">
                            本サービスは、ユーザーの同意のもと、Google Calendar APIを利用してカレンダーデータを読み取ります。ユーザーは、本サービスが提供するスケジュール自動調整等の機能の目的のためにのみ、当方が当該データにアクセスすることを許諾するものとします。
                        </p>
                    </section>

                    {/* 第4条 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            第4条（禁止事項）
                        </h2>
                        <p className="mb-2 leading-relaxed">
                            ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 text-gray-700索">
                            <li>法令または公序良俗に違反する行為</li>
                            <li>本サービスの運営を妨害するおそれのある行為</li>
                            <li>他のユーザーの認証情報を不正に使用する行為</li>
                            <li>当方、または第三者のサーバーやネットワークの機能を破壊したり妨害したりする行為</li>
                            <li>その他、当方が不適切と判断する行為</li>
                        </ul>
                    </section>

                    {/* 第5条 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            第5条（免責事項）
                        </h2>
                        <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
                            <li>当方は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
                            <li>当方は、本サービスの利用によってユーザーに生じたあらゆる損害について、一切の責任を負いません。特に、Googleカレンダーのデータ同期エラー等に起因するスケジュールの不具合や損失について、当方は責任を負いかねます。</li>
                        </ul>
                    </section>

                    {/* 第6条 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            第6条（利用規約の変更）
                        </h2>
                        <p className="leading-relaxed">
                            当方は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、ユーザーが本サービスを利用した場合には、ユーザーは変更後の規約に同意したものとみなします。
                        </p>
                    </section>

                    {/* 第7条 */}
                    <section className="pt-6 border-t border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2.5 inline-block"></span>
                            第7条（お問い合わせ）
                        </h2>
                        <p className="mb-2 leading-relaxed">
                            本規約に関するお問い合わせは、以下の連絡先までご連絡ください。
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