/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest, onCall} = require('firebase-functions/v2/https');
const {setGlobalOptions} = require('firebase-functions');
const admin = require('firebase-admin');
const {Server} = require('socket.io');

// Firestoreクエリ用のインポート
const {FieldPath} = admin.firestore;

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// CORS設定: 環境変数から許可するオリジンを取得
// 本番環境では環境変数ALLOWED_ORIGINを設定（例: https://pdtapull.web.app）
// 開発環境では未設定の場合、すべてのオリジンを許可
const getAllowedOrigin = () => {
  // 環境変数が設定されている場合はそれを使用
  if (process.env.ALLOWED_ORIGIN) {
    return process.env.ALLOWED_ORIGIN;
  }
  // 本番環境（GCLOUD_PROJECTが存在）で環境変数が未設定の場合は、安全のために何も許可しない
  if (process.env.GCLOUD_PROJECT) {
    console.error('ALLOWED_ORIGIN environment variable is not set in production.');
    return ''; // または、アプリケーションのURLなど安全なデフォルト値を設定
  }
  // 開発環境ではすべてのオリジンを許可
  return '*';
};

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Socket.ioサーバーの初期化（グローバルスコープで一度だけ）
let io = null;

/**
 * Socket.ioサーバーを初期化する
 * @param {Object} server - HTTPサーバーインスタンス
 * @return {Object} Socket.ioサーバーインスタンス
 */
function initializeSocketIO(server) {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: getAllowedOrigin(), // 環境変数から許可するオリジンを取得
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: false,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    path: '/socket.io/',
    transports: ['polling', 'websocket'], // pollingを先に試す
    allowEIO3: true,
  });

  io.on('connection', async (socket) => {
    console.log('クライアント接続:', socket.id);

    let currentUserId = null;
    let currentRoomId = null;

    // 認証とルーム参加
    socket.on('join', async (data) => {
      try {
        const {token, roomId} = data;

        if (!token || !roomId) {
          socket.emit('error', {message: 'トークンとルームIDが必要です'});
          return;
        }

        // Firebase IDトークンを検証
        const decodedToken = await admin.auth().verifyIdToken(token);
        currentUserId = decodedToken.uid;
        currentRoomId = roomId;

        // ルームに参加
        socket.join(roomId);

        // Firestoreにpresence情報を保存（複数インスタンス間で共有）
        const presenceRef = db
            .collection('chatRooms')
            .doc(roomId)
            .collection('presence')
            .doc(currentUserId);
        
        await presenceRef.set({
          userId: currentUserId,
          connectedAt: admin.firestore.FieldValue.serverTimestamp(),
          socketId: socket.id,
        });

        console.log(`ユーザー ${currentUserId} がルーム ${roomId} に参加`);

        // 参加成功を通知
        socket.emit('joined', {
          roomId,
          userId: currentUserId,
        });

        // ルーム内の他のユーザーに通知
        socket.to(roomId).emit('userJoined', {
          userId: currentUserId,
          roomId,
        });
      } catch (error) {
        console.error('認証エラー:', error);
        socket.emit('error', {message: '認証に失敗しました'});
        // 以前のルームから確実に離脱させる (join 失敗時を含む)
        if (currentRoomId) {
          socket.leave(currentRoomId);
          console.log(`ユーザー ${currentUserId || 'unknown'} が${currentRoomId} から強制的に退出`);
          currentRoomId = null;
        }
      }
    });

    // メッセージ送信
    socket.on('message', async (data) => {
      try {
        if (!currentUserId || !currentRoomId) {
          socket.emit('error', {message: 'ルームに参加していません'});
          return;
        }

        const {text} = data;

        if (!text || text.trim() === '') {
          socket.emit('error', {message: 'メッセージが空です'});
          return;
        }

        // Firestoreにメッセージを保存
        const messageData = {
          senderId: currentUserId,
          text: text.trim(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          roomId: currentRoomId,
        };

        const messageRef = await db
            .collection('chatRooms')
            .doc(currentRoomId)
            .collection('messages')
            .add(messageData);

        // ルーム情報を更新（最後のメッセージと更新日時）
        // メンバー配列はメンバー追加/招待時のみ更新する
        await db.collection('chatRooms').doc(currentRoomId).set(
            {
              lastMessage: text.trim(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            {merge: true},
        );

        // メッセージIDを追加
        const messageWithId = {
          ...messageData,
          id: messageRef.id,
          createdAt: new Date().toISOString(), // クライアント用に文字列化
        };

        console.log(`メッセージ送信: ルーム ${currentRoomId}, 送信者 ${currentUserId}`);
      } catch (error) {
        console.error('メッセージ送信エラー:', error);
        socket.emit('error', {message: 'メッセージの送信に失敗しました'});
      }
    });

    // 切断処理
    socket.on('disconnect', async () => {
      console.log('クライアント切断:', socket.id);

      if (currentRoomId && currentUserId) {
        try {
          // Firestoreからpresence情報を削除（複数インスタンス間で共有）
          const presenceRef = db
              .collection('chatRooms')
              .doc(currentRoomId)
              .collection('presence')
              .doc(currentUserId);
          
          await presenceRef.delete();

          // ルーム内の他のユーザーに通知
          socket.to(currentRoomId).emit('userLeft', {
            userId: currentUserId,
            roomId: currentRoomId,
          });
        } catch (error) {
          console.error('presence削除エラー:', error);
          // エラーが発生しても、Socket.ioの通知は送信する
          socket.to(currentRoomId).emit('userLeft', {
            userId: currentUserId,
            roomId: currentRoomId,
          });
        }
      }
    });
  });

  return io;
}

// WebSocketサーバー用のHTTP関数
exports.chatSocket = onRequest(
    {
      cors: getAllowedOrigin() === '*' ? true : [getAllowedOrigin()], // 本番環境では特定のオリジンのみ許可
      maxInstances: 10,
    },
    (req, res) => {
      // CORSヘッダーを明示的に設定（Socket.ioエンジンが処理する前に）
      const origin = req.headers.origin;
      const allowedOrigin = getAllowedOrigin();

      // 許可されたオリジンのみを設定
      if (allowedOrigin === '*') {
        // 開発環境: リクエストのオリジンを許可
        res.set('Access-Control-Allow-Origin', origin || '*');
      } else {
        // 本番環境: 許可されたオリジンのみ
        if (origin === allowedOrigin) {
          res.set('Access-Control-Allow-Origin', allowedOrigin);
        }
      }
      res.set('Access-Control-Allow-Methods',
          'GET, POST, OPTIONS, PUT, DELETE');
      res.set('Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-Requested-With');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Access-Control-Max-Age', '86400');

      // OPTIONSリクエストの処理（プリフライトリクエスト）
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      // Socket.ioサーバーの初期化
      if (!req.socket.server.io) {
        initializeSocketIO(req.socket.server);
      }

      const io = req.socket.server.io;

      // Socket.ioのエンジンがCORSヘッダーを上書きしないように、
      // レスポンスオブジェクトをラップする
      const originalSetHeader = res.setHeader;
      res.setHeader = function(name, value) {
        if (name.toLowerCase() === 'access-control-allow-origin') {
          // CORSヘッダーは既に設定されているので、上書きしない
          return this;
        }
        return originalSetHeader.call(this, name, value);
      };

      // Socket.ioのHTTPリクエストを処理
      io.engine.handleRequest(req, res);
    },
);

/**
 * 公開ユーザー情報を取得する（セキュリティ対策）
 * メールアドレスなどの機密情報は返さない
 */
exports.getPublicUserInfo = onCall(
    {
      cors: getAllowedOrigin() === '*' ? true : [getAllowedOrigin()], // 本番環境では特定のオリジンのみ許可
      maxInstances: 10,
    },
    async (request) => {
      try {
        // 認証チェック
        if (!request.auth) {
          throw new Error('認証が必要です');
        }

        const {userId} = request.data;

        if (!userId) {
          throw new Error('ユーザーIDが必要です');
        }

        // ユーザードキュメントを取得
        const userDoc = await db.collection('user').doc(userId).get();

        if (!userDoc.exists) {
          throw new Error('ユーザーが見つかりません');
        }

        const userData = userDoc.data();

        // 公開情報のみを返す（メールアドレスは除外）
        return {
          id: userId,
          name: userData['user-name'] || userData.name || 'ユーザー',
          image: userData.image || '',
        };
      } catch (error) {
        console.error('公開ユーザー情報取得エラー:', error);
        throw new Error(error.message || 'ユーザー情報の取得に失敗しました');
      }
    },
);

/**
 * ユーザー検索（セキュリティ対策・パフォーマンス最適化）
 * メールアドレスなどの機密情報は返さない
 * Firestoreのクエリを使用して効率的に検索（全件取得を避ける）
 */
exports.searchUsers = onCall(
    {
      cors: getAllowedOrigin() === '*' ? true : [getAllowedOrigin()], // 本番環境では特定のオリジンのみ許可
      maxInstances: 10,
    },
    async (request) => {
      try {
        // 認証チェック
        if (!request.auth) {
          throw new Error('認証が必要です');
        }

        const {query: searchQuery, currentUserId} = request.data;

        if (!searchQuery || !searchQuery.trim()) {
          return {results: []};
        }

        const queryLower = searchQuery.toLowerCase().trim();
        //const queryUpper = queryLower.charAt(0).toUpperCase() + queryLower.slice(1);
        const nextChar = String.fromCharCode(queryLower.charCodeAt(queryLower.length - 1) + 1);
        const queryEnd = queryLower.slice(0, -1) + nextChar;

        // 検索結果を格納するSet（重複を避けるため）
        const resultMap = new Map();

        // 1. ユーザー名で前方一致検索（user-name_lowercaseフィールドを使用して大文字小文字を区別しない検索）
        try {
          const nameQuery = db.collection('user')
              .where('user-name_lowercase', '>=', queryLower)
              .where('user-name_lowercase', '<', queryEnd)
              .limit(10);
          
          const nameSnapshot = await nameQuery.get();
          nameSnapshot.docs.forEach((doc) => {
            if (doc.id !== currentUserId) {
              const data = doc.data();
              const userNameLower = data['user-name_lowercase'] || (data['user-name'] || data.name || '').toLowerCase();
              if (userNameLower.startsWith(queryLower)) {
                resultMap.set(doc.id, {
                  id: doc.id,
                  name: data['user-name'] || data.name || 'ユーザー',
                });
              }
            }
          });
        } catch (error) {
          console.warn('ユーザー名検索エラー（続行します）:', error);
        }

        // メールアドレスによる検索は脆弱性となるため実行しない（ユーザー列挙対策）
        // 何も実装しないことで、メールアドレスをヒントとした検索は不可

        // 3. ユーザーIDで完全一致検索（短いクエリの場合のみ）
        if (queryLower.length >= 8 && queryLower.length <= 28) {
          try {
            const userDoc = await db.collection('user').doc(queryLower).get();
            if (userDoc.exists && userDoc.id !== currentUserId && !resultMap.has(userDoc.id)) {
              const data = userDoc.data();
              resultMap.set(userDoc.id, {
                id: userDoc.id,
                name: data['user-name'] || data.name || 'ユーザー',
              });
            }
          } catch (error) {
            console.warn('ユーザーID検索エラー（続行します）:', error);
          }
        }

        // 結果を配列に変換して最大10件まで返す
        const results = Array.from(resultMap.values()).slice(0, 10);

        return {results};
      } catch (error) {
        console.error('ユーザー検索エラー:', error);
        throw new Error(error.message || 'ユーザー検索に失敗しました');
      }
    },
);
