import React, { useState, useCallback } from 'react';
import axios from 'axios';
// 💡 前提: Firestoreのdbインスタンスとfirebaseを正しくインポートしていること
import { db } from '../../utils/firebase'; 
import firebase from 'firebase/compat/app';
import ProviderApplicationList from './ProviderApplicationList';

// ジオコーディングAPIのURLとキー
const GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;; 

function ContributorMatchPage() {
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

  // 住所から緯度・経度を取得する非同期関数
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

        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            setOffer(prev => ({
                ...prev,
                locationGeo: { 
                    latitude: location.lat, 
                    longitude: location.lng 
                },
            }));
        } else {
            setError('指定された住所の緯度・経度を取得できませんでした。');
            setOffer(prev => ({ ...prev, locationGeo: null }));
        }
    } catch (err) {
        setError('ジオコーディングAPIの呼び出し中にエラーが発生しました。');
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

    if (name === 'address') {
        geocodeAddress(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (offer.locationGeo === null || loading) {
        alert('有効な住所を入力し、位置情報の取得が完了するのを待ってください。');
        return;
    }

    try {
        // 登録用にデータを整形
        const offerToSave = {
            provider_id: "CURRENT_USER_ID", // ログインユーザーIDに置き換えること
            item_name: offer.itemName,
            category: offer.category, 
            quantity: offer.quantity,
            
            expiration_date: new Date(offer.expirationDate).getTime(),
            is_perishable: offer.isPerishable, 
            available_time: new Date(offer.availableTime).getTime(),
            
            location_geo: new firebase.firestore.GeoPoint(
                offer.locationGeo.latitude,
                offer.locationGeo.longitude
            ),
            address: offer.address,
            status: 'active', // 提供開始
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("offers").add(offerToSave);

        alert('提供情報が正常に登録されました！');
        // フォームを初期状態にリセット
        setOffer({
            itemName: '', quantity: 0, address: '', locationGeo: null, 
            expirationDate: '', category: '穀物', isPerishable: false, availableTime: ''
        });

    } catch (error) {
        console.error("Firestoreへのデータ登録エラー: ", error);
        alert('登録中にエラーが発生しました。コンソールを確認してください。');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="offer-form">
      <h2>食材提供情報の登録</h2>
      
      <label>食材名: 
        <input type="text" name="itemName" value={offer.itemName} onChange={handleChange} required />
      </label>

      <label>数量: 
        <input type="number" name="quantity" value={offer.quantity} onChange={handleChange} required min="1" />
      </label>

      <label>カテゴリ: 
        <select name="category" value={offer.category} onChange={handleChange} required>
          <option value="穀物">穀物・パン類</option>
          <option value="加工食品">缶詰・レトルト食品</option>
          <option value="生鮮食品">生鮮食品（野菜、果物など）</option>
          <option value="飲料">飲料・酒類</option>
        </select>
      </label>

      <label>
        <input type="checkbox" name="isPerishable" checked={offer.isPerishable} onChange={handleChange} />
        生鮮食品ですか？
      </label>

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