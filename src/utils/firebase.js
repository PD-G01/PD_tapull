// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase設定を環境変数から読み込む
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 環境変数の検証
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase環境変数が正しく設定されていません。');
  console.error('必要な環境変数:', {
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey ? '設定済み' : '未設定',
    VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain ? '設定済み' : '未設定',
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId ? '設定済み' : '未設定',
  });
  throw new Error('Firebase環境変数が不足しています。.envファイルを確認してください。');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase初期化エラー:', error);
  throw error;
}

// Initialize Firebase services
let analytics = null;
try {
  // Analyticsはブラウザ環境でのみ動作
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Firebase Analyticsの初期化に失敗しました:', error);
}

const auth = getAuth(app);
const db = getFirestore(app, 'pdtapull-db'); // カスタムデータベース名を指定
const storage = getStorage(app);

// Export for use in other files
export { app, auth, db, storage, analytics };

