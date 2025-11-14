import { Link } from 'react-router-dom';
import '../css/matching.css';
import '../css/index.css';

function MatchingPage() {
  return (
    <div className="container">
      <header className="header">
        <div className="logo-container">
          <img alt="食PULL Logo" className="logo-img" src="/image/食pull.png" />
          <h1 className="logo-title">食PULL</h1>
        </div>
        <p className="logo-subtitle">フードドライブマッチング機能への入り口</p>
      </header>

      <section id="matching-entry">
        <h2 className="section-title">あなたはどちらのユーザーですか？</h2>
        
        <div className="matching-selection">
          <Link to="/contributor-match" className="selection-card">
            <span className="material-icons selection-icon">send</span>
            <h3 className="selection-title">食材を提供する (寄付者)</h3>
            <p className="selection-description">余っている食材を必要としている団体・個人に届けたい方</p>
          </Link>

          <Link to="/recipient-match" className="selection-card">
            <span className="material-icons selection-icon">volunteer_activism</span>
            <h3 className="selection-title">食材を受け取る (団体・個人)</h3>
            <p className="selection-description">フードドライブで集まった食材を募集・受け取りたい団体や個人の方</p>
          </Link>
        </div>
        
        <Link to="/" className="back-link">
          <span className="material-icons">arrow_back</span>
          トップページへ戻る
        </Link>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <p>© 2024 食PULL. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default MatchingPage;

