import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
const searchUsers = httpsCallable(functions, 'searchUsers');
const createOneOnOneRoom = httpsCallable(functions, 'createOneOnOneRoom');

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
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
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

    const partnerIdFromUrl = searchParams.get('userId');
    const partnerIdFromState = location.state?.userId;

    const partnerId = partnerIdFromUrl || partnerIdFromState;

    if (partnerId && partnerId !== currentUser.uid) {
      // Cloud Functions経由でルームを作成（既存チェックもCloud Functions側で行う）
      const checkAndCreateRoom = async () => {
        try {

          // Cloud Functions経由でルームを作成（Admin SDKを使用してFirestoreルールを回避）
          // ユーザー情報の取得とルーム作成をCloud Functions側で行う
          let partnerName = 'ユーザー';
          let partnerImage = '';
          try {
            console.log('ユーザー情報取得開始（URL）:', { partnerId });
            const result = await getPublicUserInfo({ userId: partnerId });
            console.log('ユーザー情報取得成功（URL）:', result.data);
            partnerName = result.data.name || 'ユーザー';
            partnerImage = result.data.image || '';
          } catch (error) {
            console.error('ユーザー情報取得エラー（URL）:', error);
            console.error('エラー詳細:', {
              message: error.message,
              code: error.code,
              details: error.details,
              partnerId,
            });
            alert(`指定されたユーザーが見つかりません。\nユーザーID: ${partnerId}\nエラー: ${error.message || '不明なエラー'}`);
            navigate('/chat', { replace: true });
            return;
          }

          console.log('ルーム作成開始（URL、Cloud Functions経由）:', {
            partnerId,
            partnerName,
            partnerImage,
          });

          const createRoomResult = await createOneOnOneRoom({
            partnerId,
            partnerName,
            partnerImage,
          });

          console.log('ルーム作成結果（URL）:', createRoomResult.data);

          const roomId = createRoomResult.data.roomId;

          if (!roomId) {
            throw new Error('ルームIDが返されませんでした');
          }

          setActiveRoomId(roomId);
          // URLパラメータをクリア
          navigate('/chat', { replace: true });
        } catch (error) {
          console.error('ルーム作成エラー（URL）:', error);
          console.error('エラー詳細:', {
            message: error.message,
            code: error.code,
            details: error.details,
            stack: error.stack,
          });
          alert(`ルームの作成に失敗しました。\nエラー: ${error.message || '不明なエラー'}`);
          navigate('/chat', { replace: true });
        }
      };

      checkAndCreateRoom();
    }
  }, [currentUser, searchParams, location.state?.userId, navigate]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    console.log('ルーム監視開始:', {
      currentUserId: currentUser.uid,
      databaseName: 'pdtapull-db',
    });

    const roomsRef = collection(db, 'chatRooms');
    const roomsQuery = query(
      roomsRef,
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
        roomsQuery,
        async (snapshot) => {
          console.log('ルームリスト更新:', {
            size: snapshot.size,
            docs: snapshot.docs.map((d) => ({
              id: d.id,
              members: d.data().members,
            })),
          });

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

          console.log('ルームデータ処理完了:', {
            count: roomData.length,
            roomIds: roomData.map((r) => r.id),
          });

          setRooms(roomData);
          setIsLoadingRooms(false);

          if (!activeRoomId && roomData.length > 0) {
            setActiveRoomId(roomData[0].id);
          }
        },
        (error) => {
          console.error('ルーム監視エラー:', error);
          console.error('エラー詳細:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
          });
          setIsLoadingRooms(false);
        }
    );

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

  // IDかどうかを判定する関数（28文字の英数字の場合はIDとみなす）
  const isUserId = (str) => {
    const trimmed = str.trim();
    // FirebaseのUIDは通常28文字の英数字
    // または、長い英数字の文字列をIDとみなす
    return trimmed.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmed);
  };

  // ユーザー検索機能（Cloud Function経由）
  const handleSearchUsers = async (searchQuery) => {
    if (!searchQuery.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.trim();

    // ID形式の場合は検索をスキップ（直接IDとして扱う）
    if (isUserId(query)) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUsers({
        query: query,
        currentUserId: currentUser.uid,
      });
      
      const results = result.data.results.map((user) => ({
        id: user.id,
        name: user.name,
        email: '', // セキュリティのため、メールアドレスは返さない
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    // 選択されたユーザーの名前を検索欄に表示
    const selectedUser = searchResults.find(u => u.id === userId);
    if (selectedUser) {
      setSearchQuery(selectedUser.name);
    } else {
      setSearchQuery(userId);
    }
    setSearchResults([]);
  };

  const handleCreateRoom = async () => {
    // 選択されたユーザーIDまたは検索欄に入力されたIDを使用
    let partnerId = selectedUserId.trim();
    
    // selectedUserIdが空の場合、searchQueryからIDを取得
    if (!partnerId) {
      const query = searchQuery.trim();
      // ID形式かどうかを判定
      if (isUserId(query)) {
        partnerId = query;
      } else {
        // ID形式でない場合はエラー
        alert('有効なユーザーIDを入力してください');
        return;
      }
    }
    
    if (!currentUser || !partnerId || isCreatingRoom) {
      return;
    }

    // 自分自身とのルームは作成できない
    if (partnerId === currentUser.uid) {
      alert('自分自身とのチャットルームは作成できません');
      return;
    }

    setIsCreatingRoom(true);

    try {
      // 相手のユーザー情報を取得（Cloud Function経由）
      let partnerName = 'ユーザー';
      let partnerImage = '';
      try {
        console.log('ユーザー情報取得開始:', { 
          partnerId,
          selectedUserId,
          searchQuery,
          isUserId: isUserId(partnerId),
        });
        
        const result = await getPublicUserInfo({ userId: partnerId });
        console.log('ユーザー情報取得成功:', result.data);
        
        if (!result || !result.data) {
          throw new Error('無効なレスポンスが返されました');
        }
        
        partnerName = result.data.name || 'ユーザー';
        partnerImage = result.data.image || '';
        
        console.log('取得したユーザー情報:', {
          partnerId,
          partnerName,
          partnerImage,
        });
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
        console.error('エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          partnerId,
          stack: error.stack,
        });
        alert(`指定されたユーザーが見つかりません。\nユーザーID: ${partnerId}\nエラー: ${error.message || '不明なエラー'}`);
        setIsCreatingRoom(false);
        return;
      }

      // Cloud Functions経由でルームを作成（Admin SDKを使用してFirestoreルールを回避）
      console.log('ルーム作成開始（Cloud Functions経由）:', {
        partnerId,
        partnerName,
        partnerImage,
      });

      const createRoomResult = await createOneOnOneRoom({
        partnerId,
        partnerName,
        partnerImage,
      });

      console.log('ルーム作成結果:', createRoomResult.data);

      const roomId = createRoomResult.data.roomId;

      if (!roomId) {
        throw new Error('ルームIDが返されませんでした');
      }

      console.log('作成されたルームID:', roomId);
      console.log('ルームが新規作成されたか:', createRoomResult.data.isNew);

      // 作成したルームを選択
      setActiveRoomId(roomId);
      
      // 少し待ってからルームリストを確認
      setTimeout(() => {
        console.log('現在のルームリスト:', rooms.map((r) => r.id));
        console.log('アクティブなルームID:', roomId);
      }, 1000);

      setShowCreateRoomModal(false);
      setSearchQuery('');
      setSelectedUserId('');
      setSearchResults([]);
    } catch (error) {
      console.error('ルーム作成エラー:', error);
      console.error('エラー詳細:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack,
      });
      alert(`ルームの作成に失敗しました。\nエラー: ${error.message || '不明なエラー'}`);
    } finally {
      setIsCreatingRoom(false);
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

      <main className="chat-page-container">
        <section className="conversation-list-panel">
          <header className="panel-header">
            <h2>トーク</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="icon-button primary"
                aria-label="新しいルームを作成"
                onClick={() => setShowCreateRoomModal(true)}
                title="新しいルームを作成"
              >
                <span className="material-icons">add</span>
              </button>
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

      {/* ルーム作成モーダル */}
      {showCreateRoomModal && (
        <div className="modal-overlay" onClick={() => setShowCreateRoomModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新しいチャットルームを作成</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowCreateRoomModal(false);
                  setSearchQuery('');
                  setSelectedUserId('');
                  setSearchResults([]);
                }}
                aria-label="閉じる"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <label htmlFor="user-search" className="form-label">
                ユーザーを検索またはIDを入力
              </label>
              <div className="search-container">
                <input
                  id="user-search"
                  type="text"
                  className="form-input"
                  placeholder="名前で検索、またはユーザーIDを直接入力"
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    setSelectedUserId(''); // 検索欄が変更されたら選択をクリア
                    
                    // ID形式の場合は検索をスキップ
                    if (isUserId(query)) {
                      setSearchResults([]);
                      setIsSearching(false);
                    } else if (query.trim().length >= 2) {
                      // 名前検索を実行
                      handleSearchUsers(query);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  disabled={isCreatingRoom}
                  onKeyDown={(e) => {
                    // Enterキーでルーム作成
                    if (e.key === 'Enter' && !isCreatingRoom) {
                      e.preventDefault();
                      const query = searchQuery.trim();
                      
                      // 検索結果が1つだけの場合は自動選択
                      if (searchResults.length === 1) {
                        handleSelectUser(searchResults[0].id);
                        setTimeout(() => handleCreateRoom(), 100);
                      } else if (selectedUserId) {
                        // IDが選択されている場合
                        handleCreateRoom();
                      } else if (isUserId(query)) {
                        // ID形式が入力されている場合
                        handleCreateRoom();
                      } else if (query) {
                        // 名前が入力されているが検索結果がない場合
                        alert('ユーザーが見つかりません。ユーザーIDを直接入力してください。');
                      }
                    }
                  }}
                />
                {isSearching && (
                  <div className="search-loading">
                    <span className="material-icons rotating">sync</span>
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className={`search-result-item ${
                        selectedUserId === user.id ? 'selected' : ''
                      }`}
                      onClick={() => handleSelectUser(user.id)}
                    >
                      <div className="avatar-placeholder" aria-hidden="true">
                        {user.name.slice(0, 1)}
                      </div>
                      <div className="search-result-info">
                        <p className="search-result-name">{user.name}</p>
                        {user.email && <p className="search-result-email">{user.email}</p>}
                        <p className="search-result-id">ID: {user.id}</p>
                      </div>
                      {selectedUserId === user.id && (
                        <span className="material-icons">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedUserId && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    選択中: {searchResults.find(u => u.id === selectedUserId)?.name || selectedUserId}
                  </p>
                </div>
              )}

              <p className="form-hint" style={{ marginTop: '12px' }}>
                検索結果から選択するか、ユーザーIDを直接入力してEnterキーで作成
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setShowCreateRoomModal(false);
                  setSearchQuery('');
                  setSelectedUserId('');
                  setSearchResults([]);
                }}
                disabled={isCreatingRoom}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={handleCreateRoom}
                disabled={
                  (!selectedUserId.trim() && !isUserId(searchQuery.trim())) || 
                  isCreatingRoom
                }
              >
                {isCreatingRoom ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;

