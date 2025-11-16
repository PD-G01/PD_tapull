import React, { useState, useCallback, useEffect } from 'react';
import { db } from '../../utils/firebase'; 
import firebase from 'firebase/compat/app';

// 💡 緯度・経度から距離（km）を概算する関数
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球の半径 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 距離をキロメートルで返す
};


function RecipientMatchPage() {
    const [searchLocation, setSearchLocation] = useState(null); // { latitude, longitude }
    const [searchParams, setSearchParams] = useState({
        category: '全て',
        distanceKm: 5, // 検索許容距離 (km)
    });
    const [offers, setOffers] = useState([]);
    const [statusMessage, setStatusMessage] = useState('現在地を取得してください');
    const [loading, setLoading] = useState(false);

    // 1. 現在地を取得する関数
    const getMyCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setStatusMessage('お使いのブラウザは位置情報に対応していません。');
            return;
        }

        setLoading(true);
        setStatusMessage('現在地を特定中です...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setSearchLocation({ latitude, longitude });
                setStatusMessage(`✅ 現在地取得完了: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                setLoading(false);
            },
            (error) => {
                console.error("位置情報取得エラー:", error);
                setStatusMessage('位置情報の取得に失敗しました。ブラウザの設定を確認してください。');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, []);

    // 初回ロード時に現在地を自動取得
    useEffect(() => {
        getMyCurrentLocation();
    }, [getMyCurrentLocation]);


    // 2. 検索条件の変更を処理する関数
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ 
            ...prev, 
            [name]: name === 'distanceKm' ? Number(value) : value 
        }));
    };

    // 3. Firestoreから提供情報を検索する関数
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchLocation) {
            alert('現在地が特定できていません。');
            return;
        }

        setLoading(true);
        setStatusMessage('提供情報を検索中です...');

        try {
            const centerLat = searchLocation.latitude;
            const centerLon = searchLocation.longitude;
            const searchDistance = searchParams.distanceKm;

            const latDeg = searchDistance / 111.0; 
            const lonDeg = searchDistance / 90.0; 
            const latMin = centerLat - latDeg;
            const latMax = centerLat + latDeg;

            let query = db.collection("offers")
                .where("status", "==", "active") // 'active'な提供情報のみを対象
                .where("location_geo.latitude", ">=", latMin)
                .where("location_geo.latitude", "<=", latMax)
                .orderBy("location_geo.latitude", "asc");

            if (searchParams.category !== '全て') {
                query = query.where("category", "==", searchParams.category);
            }

            const snapshot = await query.get();
            const fetchedOffers = [];

            snapshot.forEach((doc) => {
                const offerData = doc.data();
                const offerLat = offerData.location_geo.latitude;
                const offerLon = offerData.location_geo.longitude;

                // 経度のチェックと距離計算
                if (offerLon >= centerLon - lonDeg && offerLon <= centerLon + lonDeg) {
                    const distance = calculateDistance(centerLat, centerLon, offerLat, offerLon);

                    if (distance <= searchDistance) {
                        const isExpired = new Date(offerData.expiration_date) < new Date();
                        
                        if (!isExpired) {
                            fetchedOffers.push({ 
                                id: doc.id, 
                                ...offerData, 
                                distance: distance.toFixed(1) + ' km'
                            });
                        }
                    }
                }
            });

            setOffers(fetchedOffers);
            setStatusMessage(`${fetchedOffers.length}件の提供情報が見つかりました。`);

        } catch (error) {
            console.error("検索エラー: ", error);
            setStatusMessage('検索中にエラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };
    
    // 4. マッチング申請処理
    const handleMatchApplication = async (offerId, providerId) => {
        if (loading) return;
        setLoading(true);
        setStatusMessage('マッチング申請を処理中です...');
        
        const recipientId = "CURRENT_RECIPIENT_USER_ID"; // ログインユーザーIDに置き換えること

        try {
            // 1. 新しい申請ドキュメントを 'matches' コレクションに登録
            await db.collection("matches").add({
                offer_id: offerId,
                recipient_id: recipientId,
                provider_id: providerId,
                status: 'pending', // 申請中は 'pending'
                applied_at: firebase.firestore.FieldValue.serverTimestamp(),
                last_updated: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // 2. 申請された Offer のステータスを 'pending' に更新（競合防止）
            await db.collection("offers").doc(offerId).update({
                status: 'pending',
                last_updated: firebase.firestore.FieldValue.serverTimestamp(),
            });

            setStatusMessage('✅ マッチング申請が完了しました。提供者からの承認をお待ちください。');
            
            // 申請が完了したOfferをリストから削除
            setOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));

        } catch (error) {
            console.error("マッチング申請エラー: ", error);
            setStatusMessage('マッチング申請中にエラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="recipient-page">
            <h2>食材受け取りマッチング (検索)</h2>
            <p className="status">{statusMessage}</p>
            
            <div style={{marginBottom: '20px'}}>
                {searchLocation ? (
                    <p style={{color: 'green'}}>
                        現在地: 緯度 {searchLocation.latitude.toFixed(4)}, 経度 {searchLocation.longitude.toFixed(4)}
                    </p>
                ) : (
                    <button onClick={getMyCurrentLocation} disabled={loading}>
                        {loading ? '取得中...' : '現在地を再取得'}
                    </button>
                )}
            </div>

            {/* 検索フォーム */}
            <form onSubmit={handleSearch} style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                <label>
                    カテゴリ:
                    <select name="category" value={searchParams.category} onChange={handleChange} disabled={loading}>
                        <option value="全て">全て</option>
                        <option value="穀物">穀物・パン類</option>
                        <option value="加工食品">缶詰・レトルト食品</option>
                        <option value="生鮮食品">生鮮食品</option>
                        <option value="飲料">飲料・酒類</option>
                    </select>
                </label>
                
                <label>
                    許容距離 (km):
                    <input type="number" name="distanceKm" value={searchParams.distanceKm} onChange={handleChange} min="1" max="50" disabled={loading} style={{width: '60px'}} />
                </label>

                <button type="submit" disabled={loading || !searchLocation}>
                    検索する
                </button>
            </form>

            <hr style={{margin: '20px 0'}} />

            {/* 検索結果リスト */}
            <h3>検索結果 ({offers.length}件)</h3>
            <div className="offers-list">
                {offers.length === 0 && !loading ? (
                    <p>一致する提供情報は見つかりませんでした。</p>
                ) : (
                    offers.map(offer => (
                        <div key={offer.id} style={offerCardStyle}>
                            <h4>{offer.item_name} (提供場所から {offer.distance})</h4>
                            <p><strong>数量:</strong> {offer.quantity}</p>
                            <p><strong>期限:</strong> {new Date(offer.expiration_date).toLocaleDateString('ja-JP')}</p>
                            
                            {/* マッチング申請ボタン */}
                            <button 
                                onClick={() => handleMatchApplication(offer.id, offer.provider_id)}
                                disabled={loading}
                                style={{marginTop: '10px'}}
                            >
                                この食材を受け取る！
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const offerCardStyle = {
    border: '1px solid #ccc',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '5px'
};

export default RecipientMatchPage;