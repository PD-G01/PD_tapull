// ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../utils/firebase';
import firebase from 'firebase/compat/app';

// 💡 このコンポーネントは、親コンポーネントから matchId を受け取る必要がある
function ChatWindow({ matchId, currentUserId }) { 
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // 💡 1. リアルタイムでのメッセージ取得
    useEffect(() => {
        if (!matchId) return;

        // matchId が一致するメッセージを sent_at でソートして取得
        const unsubscribe = db.collection("messages")
            .where("match_id", "==", matchId)
            .orderBy("sent_at", "asc")
            .onSnapshot(snapshot => {
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

        return () => unsubscribe(); // クリーンアップ
    }, [matchId]);

    // メッセージが追加されたら一番下までスクロール
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    // 💡 2. メッセージ送信処理
    const handleSend = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !matchId || !currentUserId) return;

        try {
            await db.collection("messages").add({
                match_id: matchId,
                sender_id: currentUserId,
                text: newMessage,
                sent_at: firebase.firestore.FieldValue.serverTimestamp(),
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
        <div style={chatContainerStyle}>
            <div style={messagesListStyle}>
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        style={msg.sender_id === currentUserId ? myMessageStyle : otherMessageStyle}
                    >
                        <strong>{msg.sender_id === currentUserId ? 'あなた' : '相手'}:</strong> {msg.text}
                        <small style={{display: 'block', fontSize: '10px', color: '#666'}}>
                            {msg.sent_at ? new Date(msg.sent_at.toDate()).toLocaleTimeString('ja-JP') : '送信中...'}
                        </small>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 3. メッセージ入力フォーム */}
            <form onSubmit={handleSend} style={inputFormStyle}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    style={inputFieldStyle}
                />
                <button type="submit" disabled={newMessage.trim() === ''} style={sendButtonStyle}>
                    送信
                </button>
            </form>
        </div>
    );
}

// 簡単なスタイル定義
const chatContainerStyle = { height: '400px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column' };
const messagesListStyle = { flexGrow: 1, overflowY: 'auto', padding: '10px', backgroundColor: '#f9f9f9' };
const baseMessageStyle = { padding: '8px', borderRadius: '10px', marginBottom: '8px', maxWidth: '70%' };
const myMessageStyle = { ...baseMessageStyle, alignSelf: 'flex-end', backgroundColor: '#dcf8c6', marginLeft: 'auto' };
const otherMessageStyle = { ...baseMessageStyle, alignSelf: 'flex-start', backgroundColor: '#fff', marginRight: 'auto', border: '1px solid #eee' };
const inputFormStyle = { display: 'flex', padding: '10px', borderTop: '1px solid #ddd' };
const inputFieldStyle = { flexGrow: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginRight: '10px' };
const sendButtonStyle = { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };


export default ChatWindow;