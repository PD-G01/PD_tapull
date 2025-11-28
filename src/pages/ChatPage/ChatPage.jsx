import { useMemo } from 'react';
import '../../global.css';
import './chat.css';
import SiteHeader from '../../components/SiteHeader';

function ChatPage() {
  const conversations = useMemo(
    () => [
      { id: 'c1', name: 'Masato.M', lastMessage: 'かわらし', lastTime: '午前6:32' },
      { id: 'c2', name: '福田 圭祐', lastMessage: 'じゃあそうちょんよぅるぁ', lastTime: '昨日' },
      { id: 'c3', name: 'ま', lastMessage: 'スタンプを送信しました', lastTime: '先週' },
      { id: 'c4', name: 'こうじ', lastMessage: '了解です！明日よろしくお願いします。', lastTime: '昨日12:31' },
      { id: 'c5', name: '角川スニーカー文庫', lastMessage: '作品情報をお届けします', lastTime: '午後12:05' },
      { id: 'c6', name: 'LINEギフト', lastMessage: '[BLACK FRIDAY特集]...', lastTime: '午前9:00' },
      { id: 'c7', name: 'ピクマ', lastMessage: 'BLACK FRIDAY！最大100%相当戻ってくる', lastTime: '午前8:10' },
    ],
    []
  );

  const messages = useMemo(
    () => [
      { id: 'm1', sender: '相手', text: 'おはようございます！', time: '午前9:01' },
      { id: 'm2', sender: '自分', text: 'おはようございます〜', time: '午前9:05' },
      { id: 'm3', sender: '相手', text: '今日の予定どうします？', time: '午前9:06' },
      { id: 'm4', sender: '自分', text: '午後から空いてます！', time: '午前9:08' },
      { id: 'm5', sender: '相手', text: '了解です、場所決めましょう！', time: '午前9:10' },
    ],
    []
  );

  return (
    <div className="page-root chat-page-root">
      <SiteHeader />

      <main className="chat-page-container">
        <section className="conversation-list-panel">
          <header className="panel-header">
            <h2>トーク</h2>
            <button type="button" className="icon-button" aria-label="トークを検索">
              <span className="material-icons">search</span>
            </button>
          </header>

          <div className="conversation-search">
            <span className="material-icons">search</span>
            <input type="text" placeholder="トークルームとメッセージ検索" disabled />
          </div>

          <ul className="conversation-list">
            {conversations.map((conv) => (
              <li key={conv.id} className="conversation-item conversation-active">
                <div className="avatar-placeholder" aria-hidden="true">
                  {conv.name.slice(0, 1)}
                </div>
                <div className="conversation-body">
                  <div className="conversation-row">
                    <span className="conversation-name">{conv.name}</span>
                    <span className="conversation-time">{conv.lastTime}</span>
                  </div>
                  <p className="conversation-snippet">{conv.lastMessage}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="chat-panel">
          <header className="chat-header">
            <div className="chat-partner">
              <div className="avatar-placeholder" aria-hidden="true">
                角
              </div>
              <div>
                <p className="chat-partner-name">角川スニーカー文庫</p>
                <p className="chat-partner-status">12:05にオンライン</p>
              </div>
            </div>
          </header>

          <div className="chat-body">
            <div className="chat-placeholder">
              <span className="material-icons rotating">sync</span>
              <p>読み込み中...</p>
            </div>

            <div className="chat-message-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender === '自分' ? 'from-self' : 'from-partner'}`}
                >
                  <p className="chat-message-text">{msg.text}</p>
                  <span className="chat-message-time">{msg.time}</span>
                </div>
              ))}
            </div>
          </div>

          <footer className="chat-input-area">
            <button type="button" className="icon-button" aria-label="写真を送信">
              <span className="material-icons">image</span>
            </button>
            <input type="text" placeholder="メッセージを入力" disabled />
            <div className="chat-input-actions">
              <button type="button" className="icon-button" aria-label="スタンプを送信">
                <span className="material-icons">emoji_emotions</span>
              </button>
              <button type="button" className="icon-button primary" aria-label="送信">
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

