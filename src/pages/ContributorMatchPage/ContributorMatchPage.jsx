import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { db, auth } from '../../utils/firebase';

import {
    collection,
    addDoc,
    serverTimestamp,
    GeoPoint
} from 'firebase/firestore'; 

import ProviderApplicationList from './ProviderApplicationList';

const GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;; 

function ContributorMatchPage() {
    // ... (stateの定義は省略)
    const [offer, setOffer] = useState({
        itemName: '',
        quantity: 0,
        address: '',
        locationGeo: null,
        expirationDate: '',
        category: '穀物',
        isPerishable: false,
        availableTime: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // 住所から緯度・経度を取得する非同期関数 (デバッグログを追加)
    const geocodeAddress = useCallback(async (address) => {
        if (!address) {
            setOffer(prev => ({ ...prev, locationGeo: null }));
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(GEOCODE_API_URL, {
                params: {
                    address: address,
                    key: API_KEY,
                },
            });
            
            // ▼ 修正1: ジオコーディングAPIの応答ステータスをチェック
            if (response.data.status === 'OK') {
                const location = response.data.results[0].geometry.location;
                console.log("✅ ジオコーディング成功 (緯度/経度):", location.lat, location.lng);
                setOffer(prev => ({
                    ...prev,
                    locationGeo: { 
                        latitude: location.lat, 
                        longitude: location.lng 
                    },
                }));
            } else {
                // ジオコーディングは200だが、データが見つからないなどのエラー
                console.error("❌ ジオコーディングAPIステータス:", response.data.status);
                setError(`指定された住所の緯度・経度を取得できませんでした。ステータス: ${response.data.status}`);
                setOffer(prev => ({ ...prev, locationGeo: null }));
            }
        } catch (err) {
            console.error('❌ ジオコーディングAPIの呼び出し中にエラーが発生しました。', err);
            setError('ジオコーディングAPIの呼び出し中にエラーが発生しました。コンソールを確認してください。');
            setOffer(prev => ({ ...prev, locationGeo: null }));
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue;

        if (e.target.type === 'checkbox') {
            newValue = e.target.checked;
        } else if (name === 'quantity') {
            newValue = Number(value);
        } else {
            newValue = value;
        }

        setOffer(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ▼ 修正2: 認証チェックを強化
        const providerId = auth.currentUser?.uid;
        if (!providerId) {
            alert('ログインユーザー情報が見つかりません。ログイン状態を確認してください。');
            console.error("❌ Firestore登録失敗: ログインユーザーID (providerId) がありません。");
            return;
        }
        
        if (offer.locationGeo === null || loading) {
            alert('有効な住所を入力し、位置情報の取得が完了するのを待ってください。');
            return;
        }

        try {
            // 登録用にデータを整形
            const offerToSave = {
                provider_id: providerId, // 認証チェック済み
                item_name: offer.itemName,
                category: offer.category, 
                quantity: offer.quantity,
                
                // Firestore Timestamp型として保存される
                expiration_date: new Date(offer.expirationDate),
                is_perishable: offer.isPerishable, 
                available_time: new Date(offer.availableTime),
                
                location_geo: new GeoPoint(
                    offer.locationGeo.latitude,
                    offer.locationGeo.longitude
                ),
                address: offer.address,
                status: 'active',
                created_at: serverTimestamp(),
            };
            
            // ▼ 修正3: 登録直前のデータをコンソールに出力
            console.log("⬆️ Firestoreに送信されるデータ:", offerToSave);

            const offersRef = collection(db, "offers");
            await addDoc(offersRef, offerToSave); 

            alert('提供情報が正常に登録されました！');
            // ... (フォームリセットの処理は省略)

        } catch (error) {
            console.error("❌ Firestoreへのデータ登録エラー: ", error); // 詳細エラーを出力
            alert('登録中にエラーが発生しました。コンソールを確認してください。');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="offer-form">
            {/* ... (JSXの残りの部分は省略) ... */}
            
            <h2>食材提供情報の登録</h2>
            
            <label>食材名: 
                <input type="text" name="itemName" value={offer.itemName} onChange={handleChange} required />
            </label>
            {/* ... 他の入力フィールド ... */}
            <label>賞味期限: 
                <input type="date" name="expirationDate" value={offer.expirationDate} onChange={handleChange} required />
            </label>
            
            <hr style={{margin: '20px 0'}} />
            <h3>受け渡し情報</h3>

            <label>受け渡し可能日時: 
                <input type="datetime-local" name="availableTime" value={offer.availableTime} onChange={handleChange} required />
            </label>

            <label>
                住所:
                <input type="text" name="address" value={offer.address} onChange={handleChange} disabled={loading} required />
            </label>

            <button 
                type="button" 
                onClick={() => geocodeAddress(offer.address)}
                disabled={loading || !offer.address}
                style={{ marginTop: '5px', marginBottom: '10px', padding: '8px 15px', cursor: (loading || !offer.address) ? 'not-allowed' : 'pointer' }}
            >
                {loading ? '位置情報取得中...' : '住所から位置情報を取得'}
            </button>


            {loading && <p style={{color: 'gray'}}>住所を検索中...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}
            {offer.locationGeo && (
                <p style={{color: 'green'}}>
                    ✅ 位置情報取得完了: ({offer.locationGeo.latitude.toFixed(4)}, {offer.locationGeo.longitude.toFixed(4)})
                </p>
            )}

            <button type="submit" disabled={loading || !offer.locationGeo}>
                提供情報を登録する
            </button>

            <hr style={{margin: '40px 0'}} />
            <ProviderApplicationList />

        </form>
    );
}

export default ContributorMatchPage;