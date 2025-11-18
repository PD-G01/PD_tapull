// ProviderApplicationList.jsx (提供者側の申請リストコンポーネント)
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../utils/firebase';

// ▼ 必要な v9 (Modular) の関数をインポート
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    writeBatch, // バッチ処理用
    getDocs,    // バッチ処理内でのクエリ実行用
    getDoc,     // 個別ドキュメント取得用
    serverTimestamp,
} from 'firebase/firestore'; 

// 💡 v8互換のインポートは削除
// import firebase from 'firebase/compat/app';

function ProviderApplicationList() {
    // 💡 ログインユーザーのIDを仮定
    const providerId = auth.currentUser?.uid;
    const [pendingApplications, setPendingApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. データ取得：自分の提供物に対する申請を全て取得 (v9形式)
    useEffect(() => {
        if (!providerId) return;
        
        const matchesRef = collection(db, "matches");
        // 💡 ポイント1: 複合クエリでDB側で絞り込む (v9形式)
        const q = query(
            matchesRef,
            where("provider_id", "==", providerId),
            where("status", "==", "pending"), 
            orderBy("applied_at", "desc")
        );
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            
            const applicationPromises = snapshot.docs.map(async (matchDoc) => {
                const matchData = matchDoc.data();
                
                let itemName = "不明なアイテム";
                let offerStatus = "unknown";

                // 💡 ポイント2: ハイブリッド取得
                // データ内に offerData (コピー) があればそれを使う (高速)
                if (matchData.offerData) {
                    itemName = matchData.offerData.item_name;
                    offerStatus = matchData.offerData.status;
                } 
                // なければ、従来どおり取りに行く (低速・互換性維持)
                else if (matchData.offer_id) {
                    // ▼ v9 形式: doc と getDoc を使用
                    const offerRef = doc(db, "offers", matchData.offer_id);
                    const offerSnapshot = await getDoc(offerRef);
                    
                    if (offerSnapshot.exists()) { // .exists() に注意
                        const offerData = offerSnapshot.data();
                        itemName = offerData.item_name;
                        offerStatus = offerData.status;
                    }
                }

                return {
                    id: matchDoc.id,
                    ...matchData,
                    itemName: itemName,
                    offerStatus: offerStatus,
                    recipientId: matchData.recipient_id
                };
            });

            const results = await Promise.all(applicationPromises);
            setPendingApplications(results.filter(r => r !== null));
            setLoading(false);
        }, (error) => {
            console.error("申請データ取得エラー:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [providerId]);


    // 3. 承認・拒否処理 (v9形式)
    const handleAction = async (matchId, offerId, action) => {
        if (loading) return;
        setLoading(true);

        try {
            // ▼ v9 形式: writeBatch を使用
            const batch = writeBatch(db); 

            // a) matches のステータスを更新 (accepted または rejected)
            // ▼ v9 形式: doc を使用して参照を取得
            const matchRef = doc(db, "matches", matchId);
            batch.update(matchRef, {
                status: action,
                // ▼ v9 形式: serverTimestamp を使用
                last_updated: serverTimestamp() 
            });

            // b) 承認の場合の追加処理
            if (action === 'accepted') {
                // Offerのステータスを 'matched' に更新
                const offerRef = doc(db, "offers", offerId);
                batch.update(offerRef, {
                    status: 'matched',
                    last_updated: serverTimestamp()
                });

                // このofferに対する他のpending状態の申請を取得
                const matchesRef = collection(db, 'matches');
                const otherAppsQuery = query(
                    matchesRef,
                    where('offer_id', '==', offerId),
                    where('status', '==', 'pending')
                );

                // ▼ v9 形式: getDocs を使用してスナップショットを取得
                const otherAppsSnapshot = await getDocs(otherAppsQuery);
                otherAppsSnapshot.forEach(doc => {
                    // 今回承認したもの以外をrejectedにする
                    if (doc.id !== matchId) {
                        batch.update(doc.ref, {
                            status: 'rejected',
                            last_updated: serverTimestamp()
                        });
                    }
                });
            }

            // バッチをコミット
            await batch.commit();
            alert(`申請を${action === 'accepted' ? '承認' : '拒否'}しました。`);

        } catch (error) {
            console.error(`${action} 処理エラー:`, error);
            alert(`処理中にエラーが発生しました。`);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <p>申請データを読み込み中...</p>;

    return (
        <div className="provider-application-list">
            <h3>あなたへの申請リスト ({pendingApplications.length}件)</h3>

            {pendingApplications.length === 0 ? (
                <p>現在、新しい申請はありません。</p>
            ) : (
                pendingApplications.map(app => (
                    <div key={app.id} style={applicationCardStyle}>
                        <h4>提供物: {app.itemName}</h4>
                        <p>申請者ID: {app.recipientId}</p>
                        {/* applied_atはFirestore Timestampなので .toDate() が必要 */}
                        <p>申請日時: {new Date(app.applied_at?.toDate()).toLocaleString('ja-JP')}</p> 

                        <div>
                            <button
                                onClick={() => handleAction(app.id, app.offer_id, 'accepted')}
                                style={{ marginRight: '10px', backgroundColor: 'green', color: 'white' }}
                                disabled={loading}
                            >
                                承認する
                            </button>
                            <button
                                onClick={() => handleAction(app.id, app.offer_id, 'rejected')}
                                style={{ backgroundColor: 'red', color: 'white' }}
                                disabled={loading}
                            >
                                拒否する
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

const applicationCardStyle = {
    border: '1px solid #007bff',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px'
};

export default ProviderApplicationList;