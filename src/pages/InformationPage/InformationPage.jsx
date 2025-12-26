import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../../utils/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import './information.css';
import '../../global.css';

function InformationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { offerId, userId } = location.state || {};
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // 認証状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleMessage = async () => {
    // マッチング申請のロジック（チャットルーム作成）
    if (!currentUser) {
      alert('ログインが必要です');
      navigate('/login');
      return;
    }

    if (!userId) {
      alert('ユーザーIDが取得できませんでした');
      return;
    }

    // 自分自身とのチャットは不可
    if (userId === currentUser.uid) {
      alert('自分自身とはチャットできません');
      return;
    }

    console.log('メッセージボタンがクリックされました');
    console.log('取得したユーザーID:', userId);
    console.log('現在のユーザーID:', currentUser.uid);

    try {
      // 既存のチャットルームをチェック
      const existingRoomsQuery = query(
        collection(db, 'chatRooms'),
        where('members', 'array-contains', currentUser.uid)
      );
      const existingRoomsSnapshot = await getDocs(existingRoomsQuery);

      const existingRoom = existingRoomsSnapshot.docs.find((doc) => {
        const data = doc.data();
        const members = data.members || [];
        // 1対1のルームのみ：メンバーが2人で、両方のユーザーが含まれている
        return members.length === 2 && 
               members.includes(userId) && 
               members.includes(currentUser.uid);
      });

      if (existingRoom) {
        // 既存のルームがある場合はそのルームIDで遷移
        console.log('既存のチャットルームが見つかりました:', existingRoom.id);
        navigate('/chat', { state: { roomId: existingRoom.id } });
        return;
      }

      // 新しいルームを作成
      console.log('新しいチャットルームを作成します');
      
      // 相手の情報を取得（既にuserDataがある場合はそれを使用）
      const partnerName = userData?.['user-name'] || 'ユーザー';
      const partnerImage = userData?.image || '';
      
      // 自分の情報を取得
      const currentUserName = currentUser.displayName || currentUser.email || 'あなた';
      const currentUserImage = currentUser.photoURL || '';
      
      // ルームIDを生成（ソートして一意性を保証）
      const roomId = [currentUser.uid, userId].sort().join('_');
      
      // ルームデータを作成
      const roomData = {
        members: [currentUser.uid, userId], // 常に2人のみ
        title: partnerName,
        displayName: partnerName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastMessage: '',
        isOneOnOne: true, // 1対1ルームのフラグ
        membersInfo: {
          [currentUser.uid]: {
            name: currentUserName,
            image: currentUserImage,
          },
          [userId]: {
            name: partnerName,
            image: partnerImage,
          },
        },
      };

      // Firestoreにチャットルームを作成
      console.log('作成するルームデータ:', {
        roomId,
        roomData,
        currentUserUid: currentUser.uid,
        members: roomData.members
      });
      
      // 既存のドキュメントをチェック
      const roomDocRef = doc(db, 'chatRooms', roomId);
      const roomDocSnap = await getDoc(roomDocRef);
      
      if (roomDocSnap.exists()) {
        console.log('ルームは既に存在します。既存のルームを使用します。');
        navigate('/chat', { state: { roomId } });
        return;
      }
      
      // 新規作成
      console.log('setDocを実行します...');
      console.log('roomId:', roomId);
      console.log('roomData:', JSON.stringify(roomData, null, 2));
      console.log('currentUser.uid:', currentUser.uid);
      console.log('members配列:', roomData.members);
      console.log('currentUser.uid in members:', roomData.members.includes(currentUser.uid));
      
      await setDoc(roomDocRef, roomData);
      console.log('チャットルームを作成しました:', roomId);
      
      // ChatPageに遷移（作成したルームIDを渡す）
      navigate('/chat', { state: { roomId } });
    } catch (error) {
      console.error('チャットルーム作成エラー:', error);
      alert('チャットルームの作成に失敗しました。もう一度お試しください。');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'フードバンク みらい',
      text: 'この団体を共有します',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // ユーザーがキャンセルした等
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('ページURLをクリップボードにコピーしました');
      } catch (e) {
        prompt('このページのURL（コピーしてください）', window.location.href);
      }
    } else {
      prompt('このページのURL', window.location.href);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) {
      alert('報告内容を入力してください。');
      return;
    }
    // TODO: サーバー送信 (fetch) の実装
    alert('報告を受け付けました。ご協力ありがとうございます。');
    setReportText('');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!offerId && !userId) {
        setLoading(false);
        return;
      }

      try {
        // offerデータを取得
        if (offerId) {
          const offerDocRef = doc(db, 'offer', offerId);
          const offerDocSnap = await getDoc(offerDocRef);
          if (offerDocSnap.exists()) {
            setOfferData(offerDocSnap.data());
          }
        }

        // userデータを取得
        if (userId) {
          const userDocRef = doc(db, 'user', userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          }
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [offerId, userId]);

  if (loading) {
    return (
      <div className="container">
        <SiteHeader />
        <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>
        <SiteFooter year={2025} />
      </div>
    );
  }

  if (!offerData && !userData) {
    return (
      <div className="container">
        <SiteHeader />
        <div style={{ padding: '2rem', textAlign: 'center' }}>データが見つかりません</div>
        <SiteFooter year={2025} />
      </div>
    );
  }

  const displayName = userData?.['user-name'] || '名前なし';
  // アバター画像はuserテーブルのimageを優先、ない場合や空文字列の場合はデフォルト画像
  const userImage = userData?.image;
  const avatarImage = (userImage && userImage.trim() !== '') ? userImage : '/kkrn_icon_user_5.png';
  // 食材画像はofferテーブルのfood_picture
  const foodImage = offerData?.food_picture || null;
  const displayLocation = offerData?.location || '場所不明';
  const displayTags = offerData?.tags || [];
  const foodName = offerData?.food_name || '食材名なし';
  const foodInfo = offerData?.food_infomation || '情報なし';
  
  // created_atの処理（FirestoreのTimestampまたはDateオブジェクトに対応）
  let formattedDate = '日付不明';
  if (offerData?.created_at) {
    try {
      const createdAt = offerData.created_at.toDate ? offerData.created_at.toDate() : offerData.created_at;
      formattedDate = createdAt.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch (e) {
      console.error('日付の変換エラー:', e);
    }
  }

  return (
    <div className="container">
      <SiteHeader />

      <main className="detail-container">
        <div className="card">
          <div className="detail-header">
            <img 
              className="avatar" 
              src={avatarImage} 
              alt={displayName}
              onError={(e) => {
                // 画像の読み込みに失敗した場合、デフォルト画像にフォールバック
                if (e.target.src !== '/kkrn_icon_user_5.png') {
                  e.target.src = '/kkrn_icon_user_5.png';
                }
              }}
            />
            <div className="meta">
              <h2 className="name">
                {displayName}
              </h2>
              <div className="sub">食材募集 — 最終更新: {formattedDate}</div>
              <div className="trust-row">
                <div className="trust-item">
                  <span className="material-icons">shield</span>
                  <span>本人確認済み</span>
                </div>
              </div>

              <div className="tag-list">
                {displayTags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>

              <div className="actions actions--top">
                <button id="btn-message" className="btn btn-primary" onClick={handleMessage}>
                  <span className="material-icons">message</span>&nbsp;メッセージ
                </button>
                <button id="btn-share" className="btn btn-ghost" onClick={handleShare}>
                  <span className="material-icons">share</span>&nbsp;共有
                </button>
                <Link className="btn btn-ghost" to="/map">
                  <span className="material-icons">map</span>&nbsp;地図で表示
                </Link>
              </div>
            </div>
          </div>

          <div className="grid">
            <div>
              <div className="info">
                <div className="info-row">
                  <span className="material-icons">location_on</span>
                  <div>
                    <div className="info-title">{displayLocation}</div>
                  </div>
                </div>

                <div className="info-row">
                  <span className="material-icons">info</span>
                  <div className="info-text">
                    <strong>募集食材:</strong> {foodName}<br />
                    <strong>詳細情報:</strong> {foodInfo}
                  </div>
                </div>

                <div className="report">
                  <h3 className="section-title">問題の報告</h3>
                  <form id="report-form" onSubmit={handleReportSubmit}>
                    <textarea
                      id="report-text"
                      required
                      className="report-textarea"
                      placeholder="不適切情報や誤りがある場合はここに記入してください"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                    />
                    <div className="form-actions">
                      <button id="report-submit" className="btn btn-primary" type="submit">
                        送信
                      </button>
                      <button
                        id="report-clear"
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => setReportText('')}
                      >
                        クリア
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <aside>
              <div className="card card--compact">
                <h4 className="section-title">地図プレビュー</h4>
                <div className="map-preview">ミニマップ（クリックで拡大）</div>

                <h4 className="section-title">募集している食材</h4>
                {foodImage && (
                  <div style={{ marginBottom: '1rem' }}>
                    <img 
                      src={foodImage} 
                      alt={foodName} 
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                )}
                <div className="tag-list tag-list--aside">
                  {displayTags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>

                <h4 className="section-title">ユーザー情報</h4>
                <div className="aside-text">
                  {displayName}<br />
                  {userData?.['mail-address'] && `メール: ${userData['mail-address']}`}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter year={2025} />
    </div>
  );
}

export default InformationPage;

