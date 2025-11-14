import { Link } from 'react-router-dom';
import '../css/index.css';

function HomePage() {
  return (
    <div className="container">
      <header className="header">
        <div className="logo-container">
          <img alt="食PULL Logo" className="logo-img" src="/image/食pull.png" />
          <h1 className="logo-title">食PULL</h1>
        </div>
        <p className="logo-subtitle">フードドライブをもっと身近に、もっと簡単に。</p>
      </header>

      <section id="features">
        <h2 className="section-title">主な機能</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="material-icons feature-icon">groups</span>
            <h3 className="feature-title">マッチング機能</h3>
            <p className="feature-description">食材を必要とする人と団体を繋げ、効率的なフードロス削減をサポートします。</p>
          </div>
          <div className="feature-card">
            <span className="material-icons feature-icon">map</span>
            <h3 className="feature-title">マップで確認</h3>
            <p className="feature-description">地図上でフードドライブの場所や集まっている食材の情報をリアルタイムに確認できます。</p>
          </div>
          <div className="feature-card">
            <span className="material-icons feature-icon">person_search</span>
            <h3 className="feature-title">詳細情報</h3>
            <p className="feature-description">他のユーザーや団体の詳細情報を確認し、安心してコミュニケーションが取れます。</p>
          </div>
          <div className="feature-card">
            <span className="material-icons feature-icon">settings</span>
            <h3 className="feature-title">設定画面</h3>
            <p className="feature-description">通知やプロフィールなど、アプリの利用設定を自分好みにカスタマイズできます。</p>
          </div>
        </div>
      </section>

      <section id="screens">
        <h2 className="section-title">アプリ画面イメージ</h2>
        <div className="screen-container">
          <div className="screen-item">
            <h3 className="screen-title">マップ画面</h3>
            <div className="phone-frame">
              <img alt="Map screen showing food drive locations" className="phone-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvSCKHNTmqUGQJtaHbzw83Dz7T335vTNPdnwdhqKBa6qXdasMnhJtXtjk10UzW428xa1nkjZf6bWDm7aBfZTIDmwSDZhm46o1Crj7P8tRIFwY1x2qeGiyyQtg4oqfbxtwYJwhZt-YeL6u98UcFJhOUPVKSuXxv8UaUQVxnOqfAvLFGIRkqjPqPoa4KyYYvBwwQjFRHzqOfHZkLxYOrRqU2uP_yGQHRxqbDXJNa2HHwmNxvXfXblv1nxXBUpMUcDD3X2cpV1x1UCxEW" />
            </div>
          </div>
          <div className="screen-item">
            <h3 className="screen-title">場所詳細ポップアップ</h3>
            <div className="phone-frame">
              <img alt="Map screen with a location detail popup" className="phone-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmdBXxnSRwSlFQ1rziUZz8wnu-mdkhbp6xLmjsQaBpY0ogenBfdkh3gMpbZglR8st4mFs9zJ_NZh-ECTJGdYQ8iiGqAmtBLFV4R-2xPVAEXZCN-Oo7Lya14YkM0-EiOzgZIHKHPslz7Nrhl5Kd1DXDmt-VyfvDmZ5tKO9jV3mWZOJGQJGqkCHwlxNZKbQ983utYI8DG5_yh-69LCaC_ZSx-aPfgna6RqG5zkSYky-O7Ny5GYTZL-S3FSRicNInk3_Trrly61HVILTK" />
            </div>
          </div>
          <div className="screen-item">
            <h3 className="screen-title">詳細・連絡画面</h3>
            <div className="phone-frame">
              <img alt="User detail and messaging screen" className="phone-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-atGAXJjEoqbtcfNcSrvrOlK8pHcdlRExyzwREK4rdmlnUIMcFRRw7D0II6baJuRbd2nlNGVrmrq9D9arE7oMteMjC-ErP4SrwtA7IBcjL1WRNbE10pWzxJPHBP2JfbC_o6WzeTAyhp0Xz-jQloatw-qAFG5RzXmMlZAUIqDxZDjsMARu4c2IqCjB8xeAkwxeCXB8Ti-HYVW0VANPu0DOgJ1JBZcrtY3JjFwBLYmhrTHeyF9FWwU-3DnDJueyhxl4v6AUEi2AZ4vN" />
            </div>
          </div>
        </div>
      </section>

      <section className="flow-section">
        <h2 className="section-title">マッチングの流れ</h2>
        <div className="flow-steps">
          <div className="step-item">
            <span className="material-icons step-icon">food_bank</span>
            <h3 className="step-title">1. 食材を提供する</h3>
            <p className="step-description">フードドライブで食材を提供 ("食pul"!)。</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="step-item">
            <span className="material-icons step-icon">quiz</span>
            <h3 className="step-title">2. ポイントをGET</h3>
            <p className="step-description">クイズに正解してさらにポイント獲得！</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="step-item">
            <span className="material-icons step-icon">emoji_events</span>
            <h3 className="step-title">3. 特典を獲得</h3>
            <p className="step-description">月間上位者にはプリペイドカード等の特典も。</p>
          </div>
        </div>
        <div className="highlight-box">
          <p className="highlight-text">
            このアプリにより、食材を必要とする人や団体と食材を<strong>マッチング</strong>させることが可能で、食材の管理もこのアプリが行うことが可能である。
          </p>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <p>© 2024 食PULL. All Rights Reserved.</p>
          <div className="footer-links">
            <a className="footer-link">プライバシーポリシー</a>
            <a className="footer-link">利用規約</a>
            <a className="footer-link">お問い合わせ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

