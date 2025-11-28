import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import './login.css';
import '../../global.css';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  // 認証状態をチェックして、ログイン済みの場合はMatchingPageにリダイレクト
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/matching');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/matching');
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  return (
    <div className="container login-container">
      <SiteHeader subtitle="フードドライブをもっと身近に。" logoSrc="/image/tapull.png" />

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

      <SiteFooter links={[]} ariaHidden={true} />
    </div>
  );
}

export default LoginPage;

