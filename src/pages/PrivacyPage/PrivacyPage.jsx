import { Link } from 'react-router-dom';
import './privacy.css';
import '../../global.css';

function PrivacyPage() {
  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link to="/signup" className="back-link">
            <span className="material-icons">arrow_back</span>
          </Link>
          <h1>プライバシーポリシー</h1>
        </div>
      </header>

      <main className="main-container">
        <div className="privacy-card">
          <PrivacyContent />
        </div>
      </main>
    </>
  );
}

// プライバシーポリシーコンテンツコンポーネント（エクスポート）
export function PrivacyContent() {
  return (
    <div className="privacy-content">
            <p className="last-updated">最終更新日: 2025年1月15日</p>

            <section className="privacy-section">
              <h2>1. はじめに</h2>
              <p>
                食PULL（以下「当サービス」といいます。）は、ユーザーの個人情報の保護を重要な責務と考えています。
                本プライバシーポリシーは、当サービスがどのような個人情報を収集し、どのように利用・共有・保護するかについて説明するものです。
                当サービスをご利用いただく際は、本プライバシーポリシーに同意していただいたものとみなします。
              </p>
            </section>

            <section className="privacy-section">
              <h2>2. 収集する情報</h2>
              <p>当サービスは、以下の情報を収集する場合があります。</p>
              
              <h3>2.1 ユーザーが提供する情報</h3>
              <ul>
                <li>氏名</li>
                <li>メールアドレス</li>
                <li>パスワード（暗号化して保存）</li>
                <li>プロフィール画像</li>
                <li>その他、ユーザーが当サービスに入力する情報</li>
              </ul>

              <h3>2.2 自動的に収集される情報</h3>
              <ul>
                <li>IPアドレス</li>
                <li>ブラウザの種類およびバージョン</li>
                <li>デバイス情報</li>
                <li>アクセス日時</li>
                <li>利用したページや機能</li>
                <li>位置情報（ユーザーが許可した場合）</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>3. 情報の利用目的</h2>
              <p>当サービスは、収集した情報を以下の目的で利用します。</p>
              <ul>
                <li>当サービスの提供、運営、維持、改善</li>
                <li>ユーザーアカウントの作成、管理、認証</li>
                <li>ユーザーへの通知、連絡、サポートの提供</li>
                <li>サービス内容の改善、新機能の開発</li>
                <li>不正利用の防止、セキュリティの確保</li>
                <li>利用規約違反の調査、対応</li>
                <li>統計データの作成（個人を特定できない形式）</li>
                <li>その他、当サービスの運営に必要な目的</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>4. 情報の共有と開示</h2>
              <p>
                当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に開示・提供することはありません。
              </p>
              <ul>
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づき開示が必要な場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>当サービスの業務の遂行に必要な範囲で、信頼できる業務委託先に開示する場合</li>
                <li>合併、会社分割、事業譲渡その他の事由により事業の承継が行われる場合</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>5. 情報の管理とセキュリティ</h2>
              <p>
                当サービスは、ユーザーの個人情報を適切に管理し、漏えい、滅失または毀損の防止その他のセキュリティの確保に努めます。
                具体的には、以下の対策を講じています。
              </p>
              <ul>
                <li>SSL/TLSによる通信の暗号化</li>
                <li>パスワードのハッシュ化保存</li>
                <li>アクセス制御による情報へのアクセス管理</li>
                <li>定期的なセキュリティ監査</li>
                <li>従業員への情報セキュリティ教育</li>
              </ul>
              <p>
                ただし、インターネット上での情報の送受信には常にリスクが伴うため、
                100%安全であることを保証するものではありません。
              </p>
            </section>

            <section className="privacy-section">
              <h2>6. データの保存期間</h2>
              <p>
                当サービスは、利用目的の達成に必要な期間、個人情報を保存します。
                アカウントが削除された場合、当サービスは関連する個人情報を合理的な期間内に削除または匿名化します。
                ただし、法令により保存が義務付けられている情報については、法令に従って保存します。
              </p>
            </section>

            <section className="privacy-section">
              <h2>7. ユーザーの権利</h2>
              <p>ユーザーは、以下の権利を有します。</p>
              <ul>
                <li>自己の個人情報の開示を請求する権利</li>
                <li>自己の個人情報の訂正、追加または削除を請求する権利</li>
                <li>自己の個人情報の利用停止または消去を請求する権利</li>
                <li>自己の個人情報の第三者への提供の停止を請求する権利</li>
              </ul>
              <p>
                これらの権利を行使したい場合は、当サービスまでお問い合わせください。
                ただし、法令により保存が義務付けられている情報については、削除できない場合があります。
              </p>
            </section>

            <section className="privacy-section">
              <h2>8. クッキー（Cookie）の利用</h2>
              <p>
                当サービスは、ユーザーの利便性向上のため、クッキーを使用する場合があります。
                クッキーは、ユーザーのブラウザに保存される小さなテキストファイルです。
                ユーザーは、ブラウザの設定によりクッキーの受け入れを拒否することができますが、
                その場合、当サービスの一部の機能が利用できなくなる可能性があります。
              </p>
            </section>

            <section className="privacy-section">
              <h2>9. 第三者サービス</h2>
              <p>
                当サービスは、サービスの提供にあたり、Firebase（Google）などの第三者サービスを利用しています。
                これらのサービスは、独自のプライバシーポリシーに従って情報を処理します。
                詳細については、各サービスのプライバシーポリシーをご確認ください。
              </p>
            </section>

            <section className="privacy-section">
              <h2>10. 未成年者の個人情報</h2>
              <p>
                当サービスは、18歳未満の未成年者から個人情報を意図的に収集することはありません。
                保護者の方は、お子様が当サービスを利用する際は、本プライバシーポリシーを確認していただき、
                必要に応じてお子様の利用を監督してください。
              </p>
            </section>

            <section className="privacy-section">
              <h2>11. プライバシーポリシーの変更</h2>
              <p>
                当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。
                変更があった場合は、当サービス上に掲示し、またはその他当サービスが適当と判断する方法により通知します。
                変更後のプライバシーポリシーは、当サービス上に掲示した時点から効力を生じるものとします。
              </p>
            </section>

            <section className="privacy-section">
              <h2>12. お問い合わせ</h2>
              <p>
                本プライバシーポリシーに関するお問い合わせ、個人情報の開示等の請求については、
                以下の連絡先までご連絡ください。
              </p>
              <p>
                <strong>食PULL 運営事務局</strong><br />
                メールアドレス: privacy@tapull.example.com<br />
                （※実際の連絡先に置き換えてください）
              </p>
            </section>
    </div>
  );
}

export default PrivacyPage;

