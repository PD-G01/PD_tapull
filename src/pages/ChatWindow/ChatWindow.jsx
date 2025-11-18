// ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../utils/firebase';

// ▼ 1. スタイル定義を削除し、CSSファイルをインポート
import './ChatWindow.css';

// ▼ 2. v9 (Modular) の関数をインポート（前々回の修正を適用）
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';


function ChatWindow({ matchId, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // 💡 1. リアルタイムでのメッセージ取得（v9形式）
    useEffect(() => {
        if (!matchId) return;

        const messagesRef = collection(db, "messages");
        const q = query(
            messagesRef,
            where("match_id", "==", matchId),
            orderBy("sent_at", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        }, (error) => {
            console.error("チャットメッセージ取得エラー:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [matchId]);

    // メッセージが追加されたら一番下までスクロール
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    // 💡 2. メッセージ送信処理（v9形式）
    const handleSend = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !matchId || !currentUserId) return;

        try {
            const messagesRef = collection(db, "messages");
            await addDoc(messagesRef, {
                match_id: matchId,
                sender_id: currentUserId,
                text: newMessage,
                sent_at: serverTimestamp(),
            });
            setNewMessage('');
        } catch (error) {
            console.error("メッセージ送信エラー:", error);
            alert("メッセージの送信に失敗しました。");
        }
    };

    if (loading) return <div>チャットを読み込み中...</div>;
    if (!matchId) return <div>チャットを開始するには、マッチングが必要です。</div>;


    return (
        // ▼ 3. スタイルオブジェクトをクラス名に置き換え
        <div className="chat-container">
            <div className="messages-list">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        // ▼ base-messageを常に適用し、条件に応じてmy-message/other-messageを追加
                        className={`base-message ${msg.sender_id === currentUserId ? 'my-message' : 'other-message'
                            }`}
                    >
                        <strong>{msg.sender_id === currentUserId ? 'あなた' : '相手'}:</strong> {msg.text}
                        <small style={{ display: 'block', fontSize: '10px', color: '#666' }}>
                            {msg.sent_at ? new Date(msg.sent_at.toDate()).toLocaleTimeString('ja-JP') : '送信中...'}
                        </small>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* ▼ フォームもクラス名で置き換え */}
            <form onSubmit={handleSend} className="input-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="input-field"
                />
                <button type="submit" disabled={newMessage.trim() === ''} className="send-button">
                    送信
                </button>
            </form>
        </div>
    );
}

// ▼ 4. コンポーネント末尾にあったスタイル定義は全て削除済み

export default ChatWindow;