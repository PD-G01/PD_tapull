import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/signup.css';
import '../css/index.css';
import { auth } from '../utils/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'personal',
    avatar: null
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target.result);
        reader.readAsDataURL(file);
        setFormData({ ...formData, avatar: file });
      } else {
        setErrors({ ...errors, avatar: '画像ファイルを選択してください' });
      }
    } else {
      setFormData({ ...formData, [name]: value });
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '名前を入力してください';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '確認用パスワードを入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Firebase Authenticationでアカウント作成
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      // ユーザーデータを保存（Firestoreに保存する場合はここで実装）
      const userData = {
        name: formData.name,
        email: formData.email,
        accountType: formData.accountType,
        createdAt: new Date().toISOString(),
        uid: userCredential.user.uid
      };
      
      // 成功時の処理
      navigate('/');
    } catch (error) {
      console.error('登録エラー:', error);
      setErrors({ submit: 'アカウントの作成に失敗しました。もう一度お試しください。' });
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link to="/" className="back-link">
            <span className="material-icons">arrow_back</span>
          </Link>
          <h1>アカウント作成</h1>
        </div>
      </header>

      <main className="main-container">
        <div className="signup-card">
          <form id="signupForm" className="signup-form" onSubmit={handleSubmit}>
            <div className="avatar-section">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="プロフィール画像" 
                       style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span className="material-icons">account_circle</span>
                )}
              </div>
              <label className="avatar-upload-button">
                プロフィール画像を選択
                <input type="file" accept="image/*" name="avatar" onChange={handleChange} hidden />
              </label>
              {errors.avatar && <span className="error-text">{errors.avatar}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="name">名前</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="例：山田 太郎"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="例：example@mail.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  placeholder="8文字以上で入力してください"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">パスワード（確認）</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="もう一度パスワードを入力"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-icons">
                    {showConfirmPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group">
              <label>アカウントタイプ</label>
              <div className="account-type-toggle">
                <label className="type-option">
                  <input
                    type="radio"
                    name="accountType"
                    value="personal"
                    checked={formData.accountType === 'personal'}
                    onChange={handleChange}
                  />
                  <span>個人</span>
                </label>
                <label className="type-option">
                  <input
                    type="radio"
                    name="accountType"
                    value="organization"
                    checked={formData.accountType === 'organization'}
                    onChange={handleChange}
                  />
                  <span>団体</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span className="checkbox-text">
                  <a href="#" className="link-text">利用規約</a>と
                  <a href="#" className="link-text">プライバシーポリシー</a>に同意する
                </span>
              </label>
            </div>

            {errors.submit && <div className="error-text">{errors.submit}</div>}

            <button type="submit" className="submit-button">
              アカウントを作成
            </button>

            <p className="login-text">
              すでにアカウントをお持ちの方は<Link to="/login" className="link-text">こちら</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}

export default SignupPage;

