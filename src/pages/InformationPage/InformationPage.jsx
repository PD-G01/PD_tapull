import { useState, useEffect, useRef } from 'react';
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
  const searchParams = new URLSearchParams(location.search);
  const offerIdFromQuery = searchParams.get('offerId');
  const userIdFromQuery = searchParams.get('userId');
  const { offerId: offerIdFromState, userId: userIdFromState } = location.state || {};
  const offerId = offerIdFromState || offerIdFromQuery;
  const userId = userIdFromState || userIdFromQuery;
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const mapRef = useRef(null);

  // --- 修正箇所: 変数定義をuseEffectの前に移動しました ---
  // データがまだロードされていない場合はデフォルト値を設定
  const displayName = userData?.['user-name'] || '名前なし';
  const displayLocation = offerData?.location || '場所不明';
  const displayTags = offerData?.tags || [];
  const foodName = offerData?.food_name || '食材名なし';
  const foodInfo = offerData?.food_infomation || '情報なし';
  
  // アバター画像処理
  const userImage = userData?.image;
  const avatarImage = (userImage && userImage.trim() !== '') ? userImage : '/kkrn_icon_user_5.png';
  // 食材画像
  const foodImage = offerData?.food_picture || null;
  // --- 移動終了 ---

  // 認証状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleMessage = async () => {
    if (!currentUser) {
      alert('ログインが必要です');
      navigate('/login');
      return;
    }

    if (!userId) {
      alert('ユーザーIDが取得できませんでした');
      return;
    }

    if (userId === currentUser.uid) {
      alert('自分自身とはチャットできません');
      return;
    }

    try {
      const existingRoomsQuery = query(
        collection(db, 'chatRooms'),
        where('members', 'array-contains', currentUser.uid)
      );
      const existingRoomsSnapshot = await getDocs(existingRoomsQuery);

      const existingRoom = existingRoomsSnapshot.docs.find((doc) => {
        const data = doc.data();
        const members = data.members || [];
        return members.length === 2 && 
               members.includes(userId) && 
               members.includes(currentUser.uid);
      });

      if (existingRoom) {
        navigate('/chat', { state: { roomId: existingRoom.id } });
        return;
      }

      const partnerName = userData?.['user-name'] || 'ユーザー';
      const partnerImage = userData?.image || '';
      const currentUserName = currentUser.displayName || currentUser.email || 'あなた';
      const currentUserImage = currentUser.photoURL || '';
      
      const roomId = [currentUser.uid, userId].sort().join('_');
      
      const roomData = {
        members: [currentUser.uid, userId],
        title: partnerName,
        displayName: partnerName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastMessage: '',
        isOneOnOne: true,
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

      const roomDocRef = doc(db, 'chatRooms', roomId);
      const roomDocSnap = await getDoc(roomDocRef);
      
      if (roomDocSnap.exists()) {
        navigate('/chat', { state: { roomId } });
        return;
      }
      
      await setDoc(roomDocRef, roomData);
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
        // キャンセル時は何もしない
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
    alert('報告を受け付けました。ご協力ありがとうございます。');
    setReportText('');
  };

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!offerId && !userId) {
        setLoading(false);
        return;
      }

      try {
        if (offerId) {
          const offerDocRef = doc(db, 'offer', offerId);
          const offerDocSnap = await getDoc(offerDocRef);
          if (offerDocSnap.exists()) {
            setOfferData(offerDocSnap.data());
          }
        }

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

  // Google Maps初期化 (依存配列の変数が定義済みになったのでエラーが消えます)
  useEffect(() => {
    // 読み込み中、または場所情報がない場合は処理しない
    if (loading || !displayLocation || displayLocation === '場所不明') return;

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: displayLocation }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: results[0].geometry.location,
            zoom: 15,
          });

          new window.google.maps.Marker({
            position: results[0].geometry.location,
            map: map,
            title: displayName,
          });

          map.addListener('click', () => {
            navigate('/map', { state: { location: displayLocation, userName: displayName } });
          });
        }
      });
    };

    const loadGoogleMaps = () => {
      if (window.google) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      // 注意: Vite環境変数 import.meta.env.VITE_GOOGLE_MAPS_API_KEY が設定されている前提
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap&language=ja`;
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, [loading, displayLocation, displayName, navigate]); // loadingを依存配列に追加

  // created_atの処理
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

  return (
    <div className="container">
      <SiteHeader />

      <main className="detail-container">
        <Link to="/matching" className="info-back-link" aria-label="マッチングページへ戻る">
          <span className="material-icons" aria-hidden="true">arrow_back</span>
          戻る
        </Link>
        <div className="card">
          <div className="detail-header">
            <img 
              className="avatar" 
              src={avatarImage} 
              alt={displayName}
              onError={(e) => {
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
                <button className="btn btn-ghost" onClick={() => navigate('/map', { state: { location: displayLocation, userName: displayName } })}>
                  <span className="material-icons">map</span>&nbsp;地図で表示
                </button>
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
                <div id="map" ref={mapRef} style={{ width: '100%', height: '200px', borderRadius: '8px' }}></div>

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