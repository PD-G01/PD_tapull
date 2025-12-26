import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

function SiteHeader({
  title = '食PULL',
  subtitle = 'フードドライブをもっと身近に、もっと簡単に。',
  logoSrc = '/image/食pull.png',
  className = 'header'
}) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState(null);

  // 認証状態とユーザー情報を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      
      if (user) {
        // Firestoreからユーザー情報を取得してアイコンを設定
        try {
          const userDocRef = doc(db, 'user', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserPhotoURL(data.image || user.photoURL || null);
          } else {
            setUserPhotoURL(user.photoURL || null);
          }
        } catch (error) {
          console.error('ユーザー情報取得エラー:', error);
          setUserPhotoURL(user.photoURL || null);
        }
      } else {
        setUserPhotoURL(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/my-information');
  };

  return (
    <header className={className}>
      <div className="header-content">
        <div className="logo-container">
          <img alt={`${title} Logo`} className="logo-img" src={logoSrc} />
          <h1 className="logo-title">{title}</h1>
        </div>
        {isAuthenticated && (
          <div className="header-actions">
            <button 
              type="button" 
              className="profile-icon-button"
              onClick={handleProfileClick}
              aria-label="プロフィール設定"
              title="プロフィール設定"
            >
              {userPhotoURL ? (
                <img 
                  src={userPhotoURL} 
                  alt="プロフィール" 
                  className="profile-icon-img"
                />
              ) : (
                <span className="material-icons">account_circle</span>
              )}
            </button>
            <button 
              type="button" 
              className="logout-button-header"
              onClick={handleLogout}
              aria-label="ログアウト"
            >
              <span className="material-icons">logout</span>
              <span className="logout-text">ログアウト</span>
            </button>
          </div>
        )}
      </div>
      {subtitle && <p className="logo-subtitle">{subtitle}</p>}
    </header>
  );
}

export default SiteHeader;

