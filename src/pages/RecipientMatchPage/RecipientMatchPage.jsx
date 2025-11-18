import React, { useState, useCallback, useEffect } from 'react';
// authも使うので、dbとauthをutilsからインポート
import { db, auth } from '../../utils/firebase';
// ▼ v9 (Modular) の関数をインポート。compatは削除
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    // updateDoc, addDoc はトランザクション内では使わない
    serverTimestamp,
    doc,
    // 💡 トランザクションに必要な runTransaction を追加
    runTransaction 
} from 'firebase/firestore'; 

// 💡 緯度・経度から距離（km）を概算する関数（変更なし）
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

    // 1. 現在地を取得する関数（ロジック省略）
    const getMyCurrentLocation = useCallback(() => {
        // ... (ロジックは変更なし) ...
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


    // 2. 検索条件の変更を処理する関数（変更なし）
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: name === 'distanceKm' ? Number(value) : value
        }));
    };

    // 3. Firestoreから提供情報を検索する関数（変更なし）
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

            // 💡 地理空間クエリの境界ボックスを計算
            const latDeg = searchDistance / 111.0;
            const latMin = centerLat - latDeg;
            const latMax = centerLat + latDeg;

            // ▼ v9形式でクエリを作成
            let offersRef = collection(db, "offers");

            // 💡 期限切れフィルタリングをDB側で実行
            let q = query(offersRef,
                where("status", "==", "active"),
                where("location_geo.latitude", ">=", latMin),
                where("location_geo.latitude", "<=", latMax),
                // ▼ 期限切れフィルタリングをクエリに追加
                where("expiration_date", ">", new Date()),
                orderBy("location_geo.latitude", "asc")
            );

            // ... (カテゴリフィルタリングのコメントは省略) ...

            // ▼ v9形式: getDocs を使ってドキュメントを取得
            const snapshot = await getDocs(q);
            const fetchedOffers = [];
            const lonDeg = searchDistance / (111.320 * Math.cos(centerLat * (Math.PI / 180)));

            snapshot.forEach((doc) => {
                const offerData = doc.data();
                const offerLat = offerData.location_geo.latitude;
                const offerLon = offerData.location_geo.longitude;

                // 💡 クライアント側で経度チェックと距離計算、カテゴリフィルタリング（Geo-Queryの制約のため）
                const passesCategory = searchParams.category === '全て' || offerData.category === searchParams.category;

                if (passesCategory && offerLon >= centerLon - lonDeg && offerLon <= centerLon + lonDeg) {
                    const distance = calculateDistance(centerLat, centerLon, offerLat, offerLon);

                    if (distance <= searchDistance) {
                        fetchedOffers.push({
                            id: doc.id,
                            ...offerData,
                            distance: distance.toFixed(1) + ' km'
                        });
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

    // 4. マッチング申請処理 (トランザクション適用)
    const handleMatchApplication = async (offerId, providerId, offerData) => {
        if (loading) return;
        setLoading(true);
        setStatusMessage('マッチング申請を処理中です...');
        
        const recipientId = auth.currentUser?.uid; 

        try {
            // ▼ トランザクション処理を開始
            await runTransaction(db, async (transaction) => {
                // 1. Offerドキュメントの参照と取得 (ロック)
                const offerRef = doc(db, "offers", offerId);
                const offerDoc = await transaction.get(offerRef);
                
                // 2. 競合チェック
                if (!offerDoc.exists()) {
                    throw new Error("この提供は存在しません。");
                }
                // 'active'であることを確認
                if (offerDoc.data().status !== 'active') {
                    throw new Error("この提供は既に申請済みか、受付を終了しています。");
                }

                // 3. Offerのステータス更新
                transaction.update(offerRef, {
                    status: 'pending',
                    last_updated: serverTimestamp(),
                });

                // 4. 新しい Match ドキュメントの作成（非正規化を適用）
                const newMatchRef = doc(collection(db, "matches"));
                transaction.set(newMatchRef, {
                    offer_id: offerId,
                    recipient_id: recipientId,
                    provider_id: providerId,
                    status: 'pending',
                    
                    // 💡 非正規化：提供物情報の一部をコピー
                    offerData: {
                        item_name: offerData.item_name,
                        status: 'pending', 
                    },
                    
                    applied_at: serverTimestamp(),
                    last_updated: serverTimestamp(),
                });
            });

            // トランザクション成功後の処理
            setStatusMessage('✅ マッチング申請が完了しました。提供者からの承認をお待ちください。');
            
            // 申請が完了したOfferをリストから削除
            setOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));

        } catch (error) {
            // トランザクション失敗時またはカスタムエラーメッセージの処理
            console.error("マッチング申請エラー: ", error);
            
            const msg = error.message || 'マッチング申請中に予期せぬエラーが発生しました。';
            setStatusMessage(`エラー: ${msg}`);
            
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="recipient-page">
            <h2>食材受け取りマッチング (検索)</h2>
            <p className="status">{statusMessage}</p>

            {/* ... JSXの残りの部分は変更なし ... */}
            <div style={{ marginBottom: '20px' }}>
                {searchLocation ? (
                    <p style={{ color: 'green' }}>
                        現在地: 緯度 {searchLocation.latitude.toFixed(4)}, 経度 {searchLocation.longitude.toFixed(4)}
                    </p>
                ) : (
                    <button onClick={getMyCurrentLocation} disabled={loading}>
                        {loading ? '取得中...' : '現在地を再取得'}
                    </button>
                )}
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
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
                    <input type="number" name="distanceKm" value={searchParams.distanceKm} onChange={handleChange} min="1" max="50" disabled={loading} style={{ width: '60px' }} />
                </label>

                <button type="submit" disabled={loading || !searchLocation}>
                    検索する
                </button>
            </form>

            <hr style={{ margin: '20px 0' }} />

            <h3>検索結果 ({offers.length}件)</h3>
            <div className="offers-list">
                {offers.length === 0 && !loading ? (
                    <p>一致する提供情報は見つかりませんでした。</p>
                ) : (
                    offers.map(offer => (
                        <div key={offer.id} style={offerCardStyle}>
                            <h4>{offer.item_name} (提供場所から {offer.distance})</h4>
                            <p><strong>数量:</strong> {offer.quantity}</p>
                            <p><strong>期限:</strong> {new Date(offer.expiration_date.toDate()).toLocaleDateString('ja-JP')}</p> 

                            <button
                                onClick={() => handleMatchApplication(offer.id, offer.provider_id, offer)}
                                disabled={loading}
                                style={{ marginTop: '10px' }}
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