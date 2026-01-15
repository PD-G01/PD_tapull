import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, updatePassword, updateProfile } from 'firebase/auth'; // updatePasswordを追加
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../utils/firebase';
import SiteHeader from '../../components/SiteHeader';
import './MyInformationPage.css';
import '../../global.css';

function MyInformationPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: null
  });
  
  // パスワード変更用のState
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      try {
        const userDocRef = doc(db, 'user', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData(data);
          setFormData({
            name: data['user-name'] || user.displayName || '',
            email: data['mail-address'] || user.email || '',
            avatar: null
          });
          setAvatarPreview(data.image || user.photoURL || null);
        } else {
          setFormData({
            name: user.displayName || '',
            email: user.email || '',
            avatar: null
          });
          setAvatarPreview(user.photoURL || null);
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
      } finally {
        setIsLoadingData(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 画像リサイズ関数 (省略)
  const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
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
          canvas.toBlob((blob) => {
            if (blob) { resolve(blob); } else { resolve(file); }
          }, file.type, quality);
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
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, avatar: '画像ファイルを選択してください' });
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors({ ...errors, avatar: '画像サイズは5MB以下にしてください' });
        return;
      }
      try {
        const resizedFile = await resizeImage(file);
        const resizedBlob = new File([resizedFile], file.name, { type: file.type });
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

  // パスワード更新処理
  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrors({ ...errors, password: 'パスワードは8文字以上で入力してください' });
      return;
    }

    setIsUpdatingPassword(true);
    setErrors({ ...errors, password: '' });

    try {
      await updatePassword(auth.currentUser, newPassword);
      alert('パスワードを正常に更新しました');
      setNewPassword('');
    } catch (error) {
      console.error('パスワード更新エラー:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('セキュリティのため、パスワード変更には再ログインが必要です。一度ログアウトしてから再度お試しください。');
      } else {
        setErrors({ ...errors, password: 'パスワードの更新に失敗しました。' });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) { newErrors.name = '名前を入力してください'; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentUser) return;
    setIsLoading(true);
    setErrors({});

    try {
      let finalAvatarURL = avatarPreview || currentUser.photoURL || '';
      if (formData.avatar) {
        try {
          const avatarRef = ref(storage, `avatars/${currentUser.uid}/${formData.avatar.name}`);
          await uploadBytes(avatarRef, formData.avatar);
          finalAvatarURL = await getDownloadURL(avatarRef);
        } catch (storageError) {
          console.warn('画像アップロードエラー:', storageError);
          setErrors(prev => ({ ...prev, avatar: '画像のアップロードに失敗しました。' }));
        }
      }

      await updateProfile(currentUser, {
        displayName: formData.name,
        photoURL: finalAvatarURL,
      });

      const updatedUserData = {
        'user-name': formData.name,
        'user-name_lowercase': formData.name.toLowerCase(),
        'mail-address': formData.email,
        'image': finalAvatarURL,
        'id': currentUser.uid,
      };

      await setDoc(doc(db, 'user', currentUser.uid), updatedUserData, { merge: true });
      alert('プロフィールを更新しました');
      navigate('/');
    } catch (error) {
      console.error('更新エラー:', error);
      setErrors({ submit: 'プロフィールの更新に失敗しました。' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="page-root my-information-page-root">
        <SiteHeader />
        <main className="main-container">読み込み中...</main>
      </div>
    );
  }

  return (
    <div className="page-root my-information-page-root">
      <SiteHeader />
      <main className="main-container">
        <div className="my-information-card">
          <h1 className="page-title">プロフィール設定</h1>
          <form className="my-information-form" onSubmit={handleSubmit}>
            <div className="avatar-section">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="プロフィール" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span className="material-icons">account_circle</span>
                )}
              </div>
              <label className="avatar-upload-button">
                プロフィール画像を変更
                <input type="file" accept="image/*" name="avatar" onChange={handleChange} hidden />
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="name">名前</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* パスワード変更用フィールド */}
            <div className="form-group password-change-section" style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
              <label htmlFor="new-password">新しいパスワード (変更する場合のみ)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8文字以上"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handlePasswordUpdate}
                  disabled={isUpdatingPassword || !newPassword}
                  className="button-secondary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isUpdatingPassword ? '変更中...' : 'パスワード変更'}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {errors.submit && <div className="error-text">{errors.submit}</div>}

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="button-secondary" onClick={() => navigate(-1)} disabled={isLoading}>キャンセル</button>
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? '更新中...' : 'プロフィールを更新'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default MyInformationPage;