import { useNavigate } from 'react-router-dom';
import './privacy.css';
import '../../global.css';

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="header">
        <div className="header-container">
          <button type="button" className="back-link" onClick={() => navigate(-1)}>
            <span className="material-icons">arrow_back</span>
          </button>
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
      <p className="last-updated">最終更新日: 2025年12月19日</p>

      <section className="privacy-section">
        <h2>1. はじめに</h2>
        <p>
          食PULL（以下「当サービス」）は、ユーザーのプライバシー保護を重要視しています。
          本ポリシーは、当サービスが収集する情報、その利用方法、第三者提供、保護対策などを説明します。
          本サービスを利用することで、本プライバシーポリシーに同意したものとみなします。
        </p>
      </section>

      <section className="privacy-section">
        <h2>2. 収集する情報</h2>
        <p>当サービスでは、以下の情報を収集・保持することがあります。</p>
        <h3>2.1 ユーザーが提供する情報</h3>
        <ul>
          <li>アカウント情報（メールアドレス、表示名 等）</li>
          <li>プロフィール情報（プロフィール画像、自己紹介 等）</li>
          <li>位置情報（ユーザーが許可した場合）</li>
          <li>お問い合わせ内容やサポートへのメッセージ</li>
        </ul>

        <h3>2.2 システムが自動的に収集する情報</h3>
        <ul>
          <li>アクセスログ（IPアドレス、利用日時、利用端末情報、ブラウザ情報）</li>
          <li>利用状況（利用したページや機能、操作履歴、クラッシュログ等）</li>
          <li>Firebase Analytics等による統計情報（個人を特定しない形式）</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>3. 利用目的</h2>
        <p>収集した情報は、以下の目的で利用します。</p>
        <ul>
          <li>当サービスの提供、認証、アカウント管理</li>
          <li>位置情報を用いたマッチングや地図機能の提供</li>
          <li>ユーザー対応（問い合わせ対応、通知）</li>
          <li>サービス改善、機能開発、利用状況の分析</li>
          <li>不正行為の検知・防止およびセキュリティ確保</li>
          <li>法令に基づく対応</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>4. 第三者提供・外部サービス</h2>
        <p>
          当サービスは、機能提供のために以下の第三者サービス（サブプロセッサ）を利用します。これらのサービスは独自のプライバシーポリシーに従ってデータを処理します。
        </p>
        <ul>
          <li>Firebase（Authentication, Cloud Firestore, Cloud Storage, Hosting, Functions）</li>
          <li>Google Analytics for Firebase（利用状況の分析・統計）</li>
        </ul>
        <p>
          上記以外でユーザーの同意なく個人を特定できる情報を第三者に販売することはありません。ただし、法令に基づく開示要求がある場合等は例外となります。
        </p>
      </section>

      <section className="privacy-section">
        <h2>5. 保管期間</h2>
        <p>
          個人情報は、利用目的達成に必要な期間保持します。アカウント削除時には、関連データは合理的な期間内に削除または匿名化します。
          ただし、法令により保存が義務付けられる情報やバックアップの保持期間は別途適用される場合があります。
        </p>
      </section>

      <section className="privacy-section">
        <h2>6. ユーザーの権利</h2>
        <p>ユーザーは当社に対して、自己情報の開示、訂正、削除、利用停止等を請求できます。手続きについてはお問い合わせください。ただし、法令により対応できない場合があります。</p>
      </section>

      <section className="privacy-section">
        <h2>7. クッキー等の利用</h2>
        <p>
          当サービスは利便性向上や解析のためにクッキーや同等の技術（localStorage等）を利用します。ブラウザの設定でクッキーを無効化できますが、一部機能が利用できなくなる場合があります。
        </p>
      </section>

      <section className="privacy-section">
        <h2>8. セキュリティ対策</h2>
        <p>
          当サービスは、通信の暗号化（TLS）、アクセス制御、Firebaseの認証・セキュリティルールの適用等により個人情報の保護に努めます。ただし、完全な安全性を保証するものではありません。
        </p>
      </section>

      <section className="privacy-section">
        <h2>9. 国際的なデータ転送</h2>
        <p>
          当サービスで利用するクラウドサービスは国内外のデータセンターにデータを保存する場合があります。国際的なデータ移転に関しては、適用法令に従い必要な保護措置を講じます。
        </p>
      </section>

      <section className="privacy-section">
        <h2>10. 未成年者</h2>
        <p>
          当サービスは18歳未満の未成年者から意図的に個人情報を収集しません。未成年者が利用する場合は、保護者の同意および監督をお願いします。
        </p>
      </section>

      <section className="privacy-section">
        <h2>11. プライバシーポリシーの変更</h2>
        <p>
          本ポリシーは必要に応じて改定します。重要な変更がある場合は、当サービス上での掲示や通知によりお知らせします。
        </p>
      </section>

      <section className="privacy-section">
        <h2>12. お問い合わせ先</h2>
        <p>
          本ポリシーや個人情報に関するご相談・開示請求は下記までご連絡ください。
        </p>
        <p>
          <strong>食PULL 運営事務局</strong><br />
          メール: c1407448@st.kanazawa-it.ac.jp
        </p>
      </section>
    </div>
  );
}

export default PrivacyPage;

