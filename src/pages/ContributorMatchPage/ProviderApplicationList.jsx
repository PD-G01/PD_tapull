// ProviderApplicationList.jsx (提供者側の申請リストコンポーネント)
import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import firebase from 'firebase/compat/app';

function ProviderApplicationList() {
    // 💡 ログインユーザーのIDを仮定 (実際には認証情報から取得)
    const providerId = "CURRENT_USER_ID"; 
    const [pendingApplications, setPendingApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. データ取得：自分の提供物に対する申請を全て取得
    useEffect(() => {
        if (!providerId) return;

        const unsubscribe = db.collection("matches")
            .where("provider_id", "==", providerId)
            // statusが 'pending' のものだけを取得するのが理想だが、
            // Firestoreは複合クエリに制約があるため、一旦 provider_id で絞り込む
            // 実際のフィルタリングはJS側で行うか、indexを定義する必要がある。
            .onSnapshot(async (snapshot) => {
                const applicationPromises = snapshot.docs.map(async (doc) => {
                    const matchData = doc.data();
                    // status が pending のものだけを処理
                    if (matchData.status !== 'pending') return null; 

                    // 2. offer_idを使って提供物情報を補完
                    const offerSnapshot = await db.collection("offers").doc(matchData.offer_id).get();
                    const offerData = offerSnapshot.exists ? offerSnapshot.data() : { item_name: "不明なアイテム" };
                    
                    return {
                        id: doc.id,
                        ...matchData,
                        itemName: offerData.item_name,
                        offerStatus: offerData.status,
                        recipientId: matchData.recipient_id // 申請者ID
                        // 実際には recipient_id を使って申請者のユーザー名なども取得すべき
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


    // 3. 承認・拒否処理
    const handleAction = async (matchId, offerId, action) => {
        if (loading) return;
        setLoading(true);

        try {
            const batch = db.batch(); // トランザクション処理

            // a) matches のステータスを更新 (accepted または rejected)
            const matchRef = db.collection("matches").doc(matchId);
            batch.update(matchRef, { 
                status: action,
                last_updated: firebase.firestore.FieldValue.serverTimestamp() 
            });

            // b) 承認の場合、offers のステータスも更新
            if (action === 'accepted') {
                const offerRef = db.collection("offers").doc(offerId);
                batch.update(offerRef, { 
                    status: 'matched',
                    last_updated: firebase.firestore.FieldValue.serverTimestamp()
                    // 💡 NOTE: ここで他の全ての pending 申請を rejected にするロジックが必要
                });
            }

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
                        <p>申請日時: {new Date(app.applied_at.toDate()).toLocaleString('ja-JP')}</p>
                        
                        <div>
                            <button 
                                onClick={() => handleAction(app.id, app.offer_id, 'accepted')}
                                style={{marginRight: '10px', backgroundColor: 'green', color: 'white'}}
                                disabled={loading}
                            >
                                承認する
                            </button>
                            <button 
                                onClick={() => handleAction(app.id, app.offer_id, 'rejected')}
                                style={{backgroundColor: 'red', color: 'white'}}
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