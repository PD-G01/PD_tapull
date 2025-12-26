import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
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
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 認証状態とユーザーデータの読み込み
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      // Firestoreからユーザー情報を取得
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
          // Firestoreにデータがない場合は、Authの情報を使用
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
                resolve(file);
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
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors({ ...errors, avatar: '画像サイズは5MB以下にしてください' });
        return;
      }

      try {
        // 画像をリサイズ
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      let finalAvatarURL = avatarPreview || currentUser.photoURL || '';

      // アバター画像をアップロード（新しい画像が選択されている場合）
      if (formData.avatar) {
        try {
          const uploadPromise = (async () => {
            const avatarRef = ref(storage, `avatars/${currentUser.uid}/${formData.avatar.name}`);
            await uploadBytes(avatarRef, formData.avatar);
            return await getDownloadURL(avatarRef);
          })();

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('画像アップロードがタイムアウトしました')), 10000)
          );

          finalAvatarURL = await Promise.race([uploadPromise, timeoutPromise]);
        } catch (storageError) {
          console.warn('画像アップロードエラー（続行します）:', storageError);
          setErrors(prev => ({ ...prev, avatar: '画像のアップロードに失敗しました。' }));
        }
      }

      // Firebase Authenticationのプロフィールを更新
      try {
        await updateProfile(currentUser, {
          displayName: formData.name,
          photoURL: finalAvatarURL,
        });
      } catch (profileError) {
        console.warn('プロフィール更新エラー（続行します）:', profileError);
      }
      
      // Firestoreにユーザー情報を保存
      const updatedUserData = {
        'user-name': formData.name,
        'user-name_lowercase': formData.name.toLowerCase(),
        'mail-address': formData.email,
        'image': finalAvatarURL,
        'id': currentUser.uid,
      };

      await setDoc(doc(db, 'user', currentUser.uid), updatedUserData, { merge: true });
      
      // 成功時の処理
      alert('プロフィールを更新しました');
      navigate('/');
    } catch (error) {
      console.error('更新エラー:', error);
      setErrors({ submit: 'プロフィールの更新に失敗しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="page-root my-information-page-root">
        <SiteHeader />
        <main className="main-container">
          <div className="loading-container">
            <span className="material-icons rotating">sync</span>
            <p>読み込み中...</p>
          </div>
        </main>
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
                  <img 
                    src={avatarPreview} 
                    alt="プロフィール画像" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                  />
                ) : (
                  <span className="material-icons">account_circle</span>
                )}
              </div>
              <label className="avatar-upload-button">
                プロフィール画像を変更
                <input 
                  type="file" 
                  accept="image/*" 
                  name="avatar" 
                  onChange={handleChange} 
                  hidden 
                />
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

            {errors.submit && (
              <div className="error-text" style={{ marginBottom: '1rem' }}>
                {errors.submit}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button"
                className="button-secondary"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default MyInformationPage;

