import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../utils/firebase';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode'); // URLからコードを取得

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      // コードの有効性を確認し、パスワードを更新
      await confirmPasswordReset(auth, oobCode, newPassword);
      alert('パスワードの更新が完了しました。');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('リンクが無効か、期限が切れています。もう一度やり直してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-card">
      <form onSubmit={handleReset}>
        <h2 className="section-title">新しいパスワードを設定</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="form-group">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新しいパスワード（8文字以上）"
            required
            minLength="8"
          />
        </div>
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? '更新中...' : 'パスワードを確定する'}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;