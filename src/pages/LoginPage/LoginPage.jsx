import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';
import '../../global.css';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  return (
    <div className="container login-container">
      <header className="header">
        <div className="logo-container">
          <img src="/image/tapull.png" alt="食PULL ロゴ" className="logo-img" />
          <h1 className="logo-title">食PULL</h1>
        </div>
        <p className="logo-subtitle">フードドライブをもっと身近に。</p>
      </header>

      <main className="login-card" role="main" aria-labelledby="login-title">
        <h2 id="login-title" className="section-title">ログイン</h2>

        <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
          {error && <div className="error-text" style={{ marginBottom: '1rem', color: 'red' }}>{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                minLength="8"
              />
              <button
                type="button"
                className="pwd-toggle"
                aria-label="パスワード表示切替"
                title="パスワード表示切替"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-icons">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div className="form-row">
            <label className="checkbox">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>ログインを保持</span>
            </label>
          </div>

          <button type="submit" className="login-button">ログイン</button>

          <p className="form-link">
            初めての方は <Link to="/signup">新規登録</Link>
          </p>
        </form>
      </main>

      <footer className="footer" aria-hidden="true">
        <div className="footer-content">
          <p></p>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;

