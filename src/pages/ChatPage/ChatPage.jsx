import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import '../../global.css';
import './chat.css';
import SiteHeader from '../../components/SiteHeader';
import { auth, db, app } from '../../utils/firebase';

const getDefaultSocketUrl = () => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId) {
    return `https://us-central1-${projectId}.cloudfunctions.net/chatSocket`;
  }
  return `http://127.0.0.1:5001/${projectId}/us-central1/chatSocket`;
};

const CHAT_SOCKET_URL =
  import.meta.env.VITE_CHAT_SOCKET_URL || getDefaultSocketUrl();

// Cloud Functionsの初期化
const functions = getFunctions(app);
const getPublicUserInfo = httpsCallable(functions, 'getPublicUserInfo');

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [isSending, setIsSending] = useState(false);
  const socketRef = useRef(null);
  const messageListRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [navigate]);

  // URLパラメータまたはlocation.stateから相手のユーザーIDを取得してルームを作成
  useEffect(() => {
    if (!currentUser) return;

    // roomIdが直接渡されている場合は、そのルームを開く
    const roomIdFromState = location.state?.roomId;
    if (roomIdFromState) {
      console.log('ChatPage: 指定されたルームIDで開きます:', roomIdFromState);
      setActiveRoomId(roomIdFromState);
      navigate('/chat', { replace: true, state: null });
      return;
    }

    const partnerIdFromUrl = searchParams.get('userId');
    const partnerIdFromState = location.state?.userId;

    console.log('ChatPage: ルーム作成チェック開始');
    console.log('location.state:', location.state);
    console.log('partnerIdFromUrl:', partnerIdFromUrl);
    console.log('partnerIdFromState:', partnerIdFromState);
    console.log('currentUser.uid:', currentUser.uid);

    const partnerId = partnerIdFromUrl || partnerIdFromState;
    
    console.log('最終的なpartnerId:', partnerId);

    if (partnerId && partnerId !== currentUser.uid) {
      // 既存のルームをチェック
      const checkAndCreateRoom = async () => {
        try {
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
                   members.includes(partnerId) && 
                   members.includes(currentUser.uid);
          });

          if (existingRoom) {
            // 既存のルームがある場合はそれを選択
            setActiveRoomId(existingRoom.id);
            // URLパラメータとstateをクリア
            navigate('/chat', { replace: true, state: null });
            return;
          }

          // 新しいルームを作成（Cloud Function経由で公開情報を取得）
          let partnerName = 'ユーザー';
          let partnerImage = '';
          try {
            const result = await getPublicUserInfo({ userId: partnerId });
            partnerName = result.data.name || 'ユーザー';
            partnerImage = result.data.image || '';
          } catch (error) {
            console.error('ユーザー情報取得エラー:', error);
            alert('指定されたユーザーが見つかりません');
            navigate('/chat', { replace: true, state: null });
            return;
          }

          const roomId = [currentUser.uid, partnerId].sort().join('_');
          const currentUserName =
            currentUser.displayName || currentUser.email || 'あなた';
          const currentUserImage = currentUser.photoURL || '';
          const roomData = {
            members: [currentUser.uid, partnerId], // 常に2人のみ
            title: partnerName,
            displayName: partnerName,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastMessage: '',
            isOneOnOne: true, // 1対1ルームのフラグ
            membersInfo: {
              [currentUser.uid]: {
                name: currentUserName,
                image: currentUserImage,
              },
              [partnerId]: {
                name: partnerName,
                image: partnerImage,
              },
            },
          };

          await setDoc(doc(db, 'chatRooms', roomId), roomData);
          setActiveRoomId(roomId);
          // URLパラメータとstateをクリア
          navigate('/chat', { replace: true, state: null });
        } catch (error) {
          console.error('ルーム作成エラー:', error);
          navigate('/chat', { replace: true, state: null });
        }
      };

      checkAndCreateRoom();
    }
  }, [currentUser, searchParams, location.state, location.key, navigate]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    const roomsRef = collection(db, 'chatRooms');
    const roomsQuery = query(
      roomsRef,
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      const roomData = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const members = data.members || [];

        // 相手のユーザーIDを取得（現在のユーザー以外）
        const partnerId = members.find((id) => id !== currentUser.uid);

        // ルームに保存された公開情報を使用（N+1を避ける）
        const membersInfo = data.membersInfo || {};
        const title =
          (partnerId && membersInfo[partnerId]?.name) ||
          data.title ||
          data.displayName ||
          'チャットルーム';

        return {
          id: docSnapshot.id,
          title,
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
          members,
        };
      });

      roomData.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });

      setRooms(roomData);
      setIsLoadingRooms(false);

      if (!activeRoomId && roomData.length > 0) {
        setActiveRoomId(roomData[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatTimestamp = useCallback((value) => {
    if (!value) {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }, []);

  // Firestoreのリアルタイムリスナーでメッセージを監視
  useEffect(() => {
    if (!activeRoomId || !currentUser) {
      setMessages([]);
      return undefined;
    }

    setIsLoadingMessages(true);
    const messagesRef = collection(db, 'chatRooms', activeRoomId, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'asc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            text: data.text,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt,
          };
        });
        setMessages(messageData);
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error('メッセージ監視エラー:', error);
        setIsLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [activeRoomId, currentUser]);

  // WebSocket接続管理の効率化：コンポーネントマウント時に一度だけ接続を行い、ルーム切替時はjoin/leaveイベントのみ
  useEffect(() => {
    let isMounted = true;
    let socket = socketRef.current;

    const connectSocketOnce = async () => {
      if (!currentUser) {
        setSocketStatus('disconnected');
        return;
      }
      if (socketRef.current) {
        // すでに接続済みの場合は何もしない（ルーム切替は別で処理）
        return;
      }
      try {
        const token = await currentUser.getIdToken();
        socket = io(CHAT_SOCKET_URL, {
          transports: ['polling', 'websocket'],
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
          auth: {
            token,
          },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          if (!isMounted) return;
          setSocketStatus('connected');
        });

        socket.on('disconnect', () => {
          if (!isMounted) return;
          setSocketStatus('disconnected');
        });

        socket.on('connect_error', (error) => {
          console.warn('ソケット接続エラー:', error.message);
          if (!isMounted) return;
          setSocketStatus('disconnected');
        });

        socket.on('newMessage', () => {
          // Firestoreのリアルタイムリスナーで自動処理するので何もしない
        });
      } catch (e) {
        console.warn('ソケット初期化エラー:', e);
        setSocketStatus('disconnected');
      }
    };

    connectSocketOnce();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        // ルーム退室前にleaveイベントを出す
        if (activeRoomId && currentUser) {
          socketRef.current.emit('leave', { roomId: activeRoomId });
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketStatus('disconnected');
    };
    // currentUserが変わった時のみソケットの再生成を許す
  }, [currentUser]);

  // ルーム切替時join/leaveイベント管理
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !currentUser) {
      return;
    }

    // 以前のルームから離脱
    if (socket.prevRoomId && socket.prevRoomId !== activeRoomId) {
      socket.emit('leave', { roomId: socket.prevRoomId });
    }

    // 新しいルームに参加
    if (activeRoomId) {
      currentUser.getIdToken().then(token => {
        socket.emit('join', { token, roomId: activeRoomId });
        socket.prevRoomId = activeRoomId;
      });
    }

    // クリーンアップ時にはleaveイベント（ただしソケット自体は生きる）
    return () => {
      if (socket && activeRoomId) {
        socket.emit('leave', { roomId: activeRoomId });
      }
    };
  }, [activeRoomId, currentUser]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentUser || !inputValue.trim() || !activeRoomId || isSending) {
      return;
    }

    setIsSending(true);
    const messageText = inputValue.trim();
    setInputValue('');

    try {
      // WebSocketが接続されている場合はWebSocket経由で送信
      if (socketRef.current && socketStatus === 'connected') {
        socketRef.current.emit('message', {
          text: messageText,
          roomId: activeRoomId,
        });
      } else {
        // WebSocketが接続されていない場合は、直接Firestoreに保存
        const messageData = {
          senderId: currentUser.uid,
          text: messageText,
          createdAt: Timestamp.now(),
          roomId: activeRoomId,
        };

        await addDoc(
          collection(db, 'chatRooms', activeRoomId, 'messages'),
          messageData
        );

        // ルーム情報を更新
        await setDoc(
          doc(db, 'chatRooms', activeRoomId),
          {
            lastMessage: messageText,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました');
      setInputValue(messageText); // エラー時は入力値を戻す
    } finally {
      setIsSending(false);
    }
  };


  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId),
    [rooms, activeRoomId]
  );

  const renderMessages = () => {
    if (isLoadingMessages) {
      return (
        <div className="chat-placeholder">
          <span className="material-icons rotating">sync</span>
          <p>履歴を読み込んでいます...</p>
        </div>
      );
    }

    if (!messages.length) {
      return (
        <div className="chat-placeholder">
          <span className="material-icons">chat</span>
          <p>最初のメッセージを送信してみましょう。</p>
        </div>
      );
    }

    return (
      <div className="chat-message-list" ref={messageListRef}>
        {messages.map((msg) => {
          const isSelf = currentUser && msg.senderId === currentUser.uid;
          return (
            <div
              key={msg.id}
              className={`chat-message ${isSelf ? 'from-self' : 'from-partner'}`}
            >
              <p className="chat-message-text">{msg.text}</p>
              <span className="chat-message-time">
                {formatTimestamp(msg.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-root chat-page-root">
      <SiteHeader />

      <div className="chat-top-actions">
        <Link to="/matching" className="chat-back-link" aria-label="マッチングページへ戻る">
          <span className="material-icons" aria-hidden="true">arrow_back</span>
          戻る
        </Link>
      </div>

      <main className="chat-page-container">
        <section className="conversation-list-panel">
          <header className="panel-header">
            <h2>トーク</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="icon-button" aria-label="トークを検索">
                <span className="material-icons">search</span>
              </button>
            </div>
          </header>

          <div className="conversation-search">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="トークルームとメッセージ検索"
              disabled
            />
          </div>

          <div className="conversation-list">
            {isLoadingRooms && (
              <div className="chat-placeholder">
                <span className="material-icons rotating">sync</span>
                <p>ルームを読み込み中...</p>
              </div>
            )}

            {!isLoadingRooms && !rooms.length && (
              <div className="chat-placeholder">
                <span className="material-icons">group</span>
                <p>現在表示できるチャットルームがありません。</p>
              </div>
            )}

            {!isLoadingRooms &&
              rooms.map((room) => (
                <button
                  type="button"
                  key={room.id}
                  className={`conversation-item ${
                    activeRoomId === room.id ? 'conversation-active' : ''
                  }`}
                  onClick={() => setActiveRoomId(room.id)}
                >
                  <div className="avatar-placeholder" aria-hidden="true">
                    {room.title.slice(0, 1)}
                  </div>
                  <div className="conversation-body">
                    <div className="conversation-row">
                      <span className="conversation-name">{room.title}</span>
                      <span className="conversation-time">
                        {room.updatedAt ? formatTimestamp(room.updatedAt) : ''}
                      </span>
                    </div>
                    <p className="conversation-snippet">
                      {room.lastMessage || 'メッセージはまだありません'}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </section>

        <section className="chat-panel">
          <header className="chat-header">
            <div className="chat-partner">
              <div className="avatar-placeholder" aria-hidden="true">
                {activeRoom?.title?.slice(0, 1) || '?'}
              </div>
              <div>
                <p className="chat-partner-name">
                  {activeRoom?.title || 'チャットルーム'}
                </p>
                <p className="chat-partner-status">
                  ソケット: {socketStatus === 'connected' ? '接続中' : '未接続'}
                </p>
              </div>
            </div>
          </header>

          <div className="chat-body">{renderMessages()}</div>

          <footer className="chat-input-area">
            <button type="button" className="icon-button" aria-label="写真を送信">
              <span className="material-icons">image</span>
            </button>
            <input
              type="text"
              placeholder={activeRoom ? 'メッセージを入力' : 'ルームを選択してください'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!activeRoom}
              onKeyDown={(e) => {
                if (e.isComposing || e.nativeEvent.isComposing) {
                  return; // IME変換確定のEnterは送信しない
                }
                if (e.key === 'Enter' && activeRoom && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="chat-input-actions">
              <button type="button" className="icon-button" aria-label="スタンプを送信">
                <span className="material-icons">emoji_emotions</span>
              </button>
              <button
                type="button"
                className="icon-button primary"
                aria-label="送信"
                onClick={handleSendMessage}
                disabled={!activeRoom}
              >
                <span className="material-icons">send</span>
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default ChatPage;

