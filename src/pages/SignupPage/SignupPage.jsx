import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './signup.css';
import '../../global.css';
import { auth, db, storage } from '../../utils/firebase';
import { createUserWithEmailAndPassword, updateProfile, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: true, // true = 食料を募集する, false = 食料を探す
    avatar: null
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 画像をリサイズする関数
  const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // アスペクト比を保ちながらリサイズ
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file); // リサイズ失敗時は元のファイルを返す
              }
            },
            file.type,
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files && files[0]) {
      const file = files[0];
      
      // ファイルタイプの検証
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, avatar: '画像ファイルを選択してください' });
        return;
      }

      // ファイルサイズの検証（5MB以下）
      const maxSize = 5 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setErrors({ ...errors, avatar: '画像サイズは5MB以下にしてください' });
        return;
      }

      try {
        // 画像をリサイズ（最大800x800px）
        const resizedFile = await resizeImage(file);
        const resizedBlob = new File([resizedFile], file.name, { type: file.type });

        // プレビュー用に読み込み
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target.result);
        reader.readAsDataURL(resizedBlob);

        setFormData({ ...formData, avatar: resizedBlob });
        setErrors({ ...errors, avatar: '' });
      } catch (error) {
        console.error('画像処理エラー:', error);
        setErrors({ ...errors, avatar: '画像の処理に失敗しました' });
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

  // Firebaseエラーメッセージを日本語に変換
  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています。';
      case 'auth/invalid-email':
        return '無効なメールアドレスです。';
      case 'auth/operation-not-allowed':
        return 'この操作は許可されていません。';
      case 'auth/weak-password':
        return 'パスワードが弱すぎます。8文字以上で入力してください。';
      case 'auth/network-request-failed':
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      default:
        return 'アカウントの作成に失敗しました。もう一度お試しください。';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Firebase Authenticationでアカウント作成
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      let avatarURL = null;

      // アバター画像をアップロード（選択されている場合）
      // タイムアウトを設定して、長時間かかる場合はスキップ
      if (formData.avatar) {
        try {
          const uploadPromise = (async () => {
            const avatarRef = ref(storage, `avatars/${user.uid}/${formData.avatar.name}`);
            await uploadBytes(avatarRef, formData.avatar);
            return await getDownloadURL(avatarRef);
          })();

          // 10秒でタイムアウト
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('画像アップロードがタイムアウトしました')), 10000)
          );

          avatarURL = await Promise.race([uploadPromise, timeoutPromise]);
        } catch (storageError) {
          console.warn('画像アップロードエラー（続行します）:', storageError);
          // 画像アップロードに失敗しても、avatarURLはnullのまま続行します
        }
      }
      // プロフィール更新（表示名と、あればアバターURL）を一度に行う
      try {
        await updateProfile(user, {
          displayName: formData.name,
          photoURL: avatarURL, // avatarURLがnullでも問題ありません
        });
      } catch (profileError) {
        console.warn('プロフィール更新エラー（続行します）:', profileError);
      }
      
      // Firestoreにユーザー情報を保存（Firestoreのフィールド構造に合わせる）
      const userData = {
        'user-name': formData.name,
        'mail-address': formData.email,
        'account-type': formData.accountType, // true = 食料を募集する, false = 食料を探す
        'image': avatarURL || '',
        'id': user.uid,
      };

      try {
        console.log('Firestore保存開始:', {
          collection: 'user',
          uid: user.uid,
          data: userData,
          db: db ? '初期化済み' : '未初期化'
        });
        await setDoc(doc(db, 'user', user.uid), userData);
        console.log('Firestoreへの保存成功:', user.uid);
      } catch (firestoreError) {
        console.error('Firestore保存エラー:', firestoreError);
        console.error('エラー詳細:', {
          code: firestoreError.code,
          message: firestoreError.message,
          uid: user.uid,
          data: userData
        });
        
        // Firestore保存に失敗した場合、作成されたユーザーを削除してロールバック
        try {
          console.log('ユーザーアカウントのロールバック開始:', user.uid);
          await deleteUser(user);
          console.log('ユーザーアカウントの削除成功:', user.uid);
        } catch (deleteError) {
          console.error('ユーザー削除エラー（ロールバック失敗）:', deleteError);
          console.error('削除エラー詳細:', {
            code: deleteError.code,
            message: deleteError.message,
            uid: user.uid
          });
          // 削除に失敗した場合でも、ユーザーにはエラーを通知
        }
        
        setErrors({ submit: 'ユーザー情報の保存に失敗しました。もう一度お試しください。' });
        setIsLoading(false);
        return; // ここで処理を中断
      }
      
      // 成功時の処理
      navigate('/');
    } catch (error) {
      console.error('登録エラー:', error);
      console.error('エラー詳細:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setErrors({ submit: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
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
                    value="true"
                    checked={formData.accountType === true}
                    onChange={() => setFormData({ ...formData, accountType: true })}
                  />
                  <span>食料を募集する</span>
                </label>
                <label className="type-option">
                  <input
                    type="radio"
                    name="accountType"
                    value="false"
                    checked={formData.accountType === false}
                    onChange={() => setFormData({ ...formData, accountType: false })}
                  />
                  <span>食料を探す</span>
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

            {errors.submit && <div className="error-text" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? '作成中...' : 'アカウントを作成'}
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

