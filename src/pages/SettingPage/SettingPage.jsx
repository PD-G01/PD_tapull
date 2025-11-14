import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './setting.css';
import '../../global.css';
import { auth } from '../../utils/firebase';
import { signOut } from 'firebase/auth';

function SettingPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  return (
    <div className="container">
      <header className="settings-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <span className="material-icons">arrow_back</span>
        </button>
        <h1>設定</h1>
      </header>

      <main className="settings-content">
        <section className="settings-section">
          <h2 className="section-title">アカウント設定</h2>
          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">account_circle</span>
                <span>プロフィール編集</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">notifications</span>
                <span>通知設定</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">privacy_tip</span>
                <span>プライバシー設定</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">アプリ設定</h2>
          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">dark_mode</span>
                <span>ダークモード</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  id="darkModeToggle"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">language</span>
                <span>言語設定</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">location_on</span>
                <span>位置情報設定</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">その他</h2>
          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">help</span>
                <span>ヘルプ・サポート</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">description</span>
                <span>利用規約</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
            <div className="settings-item">
              <div className="settings-item-left">
                <span className="material-icons">policy</span>
                <span>プライバシーポリシー</span>
              </div>
              <span className="material-icons">chevron_right</span>
            </div>
          </div>
        </section>

        <div className="logout-button">
          <button className="btn-logout" onClick={handleLogout}>
            <span className="material-icons">logout</span>
            ログアウト
          </button>
        </div>
      </main>
    </div>
  );
}

export default SettingPage;

