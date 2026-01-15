import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';
import '../../global.css';
import { auth } from '../../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence,
  sendPasswordResetEmail // 追加
} from 'firebase/auth';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // 完了メッセージ用

  // 認証状態をチェック
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/matching');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // スクロール無効化
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      await signInWithEmailAndPassword(auth, email, password);
      navigate('/matching');
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  // パスワード再設定メール送信処理
  const handleForgotPassword = async () => {
    if (!email) {
      setError('パスワードを再設定するには、まずメールアドレスを入力してください。');
      return;
    }
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('パスワード再設定用のメールを送信した。メールを確認してほしい。');
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      if (error.code === 'auth/user-not-found') {
        setError('このメールアドレスは登録されていない。');
      } else {
        setError('メール送信に失敗した。しばらく時間を置いてから試してほしい。');
      }
    }
  };

  return (
    <>
      <main className="main-container">
        <div className="login-card">
          <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
            <h2 className="section-title">ログイン</h2>

            {error && <div className="error-text">{error}</div>}
            {message && <div className="success-text" style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
            
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例: example@mail.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8文字以上で入力してください"
                  required
                  autoComplete="current-password"
                  minLength="8"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              {/* パスワード忘れリンクの追加 */}
              <div style={{ textAlign: 'right', marginTop: '5px' }}>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="link-text"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#007bff' }}
                >
                  パスワードを忘れた方はこちら
                </button>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember" className="checkbox-text">
                ログインを保持
              </label>
            </div>

            <button type="submit" className="login-button">ログイン</button>

            <p className="login-text">
              初めての方は<Link to="/signup" className="link-text">新規登録</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}

export default LoginPage;