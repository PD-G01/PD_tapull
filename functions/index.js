/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require('firebase-functions/v2/https');
const {setGlobalOptions} = require('firebase-functions');
const admin = require('firebase-admin');
const {Server} = require('socket.io');

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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

// 接続管理用のMap（ルームID -> 接続中のユーザーIDの配列）
const roomUsers = new Map();

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
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
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

        // ルームのユーザーリストを更新
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Set());
        }
        roomUsers.get(roomId).add(currentUserId);

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
        await db.collection('chatRooms').doc(currentRoomId).set(
            {
              lastMessage: text.trim(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              members: admin.firestore.FieldValue.arrayUnion(currentUserId),
            },
            {merge: true},
        );

        // メッセージIDを追加
        const messageWithId = {
          ...messageData,
          id: messageRef.id,
          createdAt: new Date().toISOString(), // クライアント用に文字列化
        };

        // ルーム内の全員にメッセージをブロードキャスト
        io.to(currentRoomId).emit('newMessage', messageWithId);

        console.log(`メッセージ送信: ルーム ${currentRoomId}, 送信者 ${currentUserId}`);
      } catch (error) {
        console.error('メッセージ送信エラー:', error);
        socket.emit('error', {message: 'メッセージの送信に失敗しました'});
      }
    });

    // 切断処理
    socket.on('disconnect', () => {
      console.log('クライアント切断:', socket.id);

      if (currentRoomId && currentUserId) {
        // ルームからユーザーを削除
        if (roomUsers.has(currentRoomId)) {
          roomUsers.get(currentRoomId).delete(currentUserId);
          if (roomUsers.get(currentRoomId).size === 0) {
            roomUsers.delete(currentRoomId);
          }
        }

        // ルーム内の他のユーザーに通知
        socket.to(currentRoomId).emit('userLeft', {
          userId: currentUserId,
          roomId: currentRoomId,
        });
      }
    });
  });

  return io;
}

// WebSocketサーバー用のHTTP関数
exports.chatSocket = onRequest(
    {
      cors: true,
      maxInstances: 10,
    },
    (req, res) => {
    // Socket.ioサーバーの初期化
      if (!req.socket.server.io) {
        initializeSocketIO(req.socket.server);
      }

      // Socket.ioのHTTPリクエストを処理
      req.socket.server.io.engine.handleRequest(req, res);
    },
);
