import { Link } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import '../../global.css';
import './HomePage.css';

function HomePage() {
  return (
    <div className="container">
      <SiteHeader />

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

      <SiteFooter />
    </div>
  );
}

export default HomePage;

