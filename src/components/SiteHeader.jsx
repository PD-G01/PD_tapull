import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

function SiteHeader({
  title = '食PULL',
  subtitle = 'フードドライブをもっと身近に、もっと簡単に。',
  logoSrc = '/image/食pull.png',
  className = 'header'
}) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 認証状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
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

  return (
    <header className={className}>
      <div className="header-content">
        <div className="logo-container">
          <img alt={`${title} Logo`} className="logo-img" src={logoSrc} />
          <h1 className="logo-title">{title}</h1>
        </div>
        {isAuthenticated && (
          <button 
            type="button" 
            className="logout-button-header"
            onClick={handleLogout}
            aria-label="ログアウト"
          >
            <span className="material-icons">logout</span>
            <span className="logout-text">ログアウト</span>
          </button>
        )}
      </div>
      {subtitle && <p className="logo-subtitle">{subtitle}</p>}
    </header>
  );
}

export default SiteHeader;

