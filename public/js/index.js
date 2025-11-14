// index.html用のJavaScriptファイル
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

// 認証状態をチェックして、未ログインの場合はsignup.htmlにリダイレクト
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // ログイン情報が保存されていない場合、signup.htmlにリダイレクト
        window.location.href = './files/signup.html';
    }
    // ログイン済みの場合は、そのままindex.html（ランディングページ）を表示
});
