import { useState } from 'react';
import { Link } from 'react-router-dom';
import './information.css';
import '../../global.css';

function InformationPage() {
  const [reportText, setReportText] = useState('');

  const handleMessage = () => {
    window.location.href = 'mailto:info@example.org';
  };

  const handleShare = async () => {
    const shareData = {
      title: 'フードバンク みらい',
      text: 'この団体を共有します',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // ユーザーがキャンセルした等
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('ページURLをクリップボードにコピーしました');
      } catch (e) {
        prompt('このページのURL（コピーしてください）', window.location.href);
      }
    } else {
      prompt('このページのURL', window.location.href);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) {
      alert('報告内容を入力してください。');
      return;
    }
    // TODO: サーバー送信 (fetch) の実装
    alert('報告を受け付けました。ご協力ありがとうございます。');
    setReportText('');
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo-container">
          <img alt="食PULL Logo" className="logo-img" src="/image/食pull.png" />
          <h1 className="logo-title">食PULL</h1>
        </div>
        <p className="logo-subtitle">フードドライブをもっと身近に、もっと簡単に。</p>
      </header>

      <main className="detail-container">
        <div className="card">
          <div className="detail-header">
            <img className="avatar" src="/image/placeholder.jpg" alt="団体／ユーザー画像" />
            <div className="meta">
              <h2 className="name">
                フードバンク みらい{' '}
                <span className="verified">
                  <span className="material-icons">verified</span>認証済み
                </span>
              </h2>
              <div className="sub">非営利団体・受け取り拠点 — 最終更新: 2025-01-15</div>
              <div className="trust-row">
                <div className="rating-display">
                  <span className="material-icons">star</span>
                  <strong>4.2</strong>
                  <span className="review-count">(レビュー 32件)</span>
                </div>
                <div className="trust-item">
                  <span className="material-icons">shield</span>
                  <span>本人確認済み</span>
                </div>
              </div>

              <div className="tag-list">
                <span className="tag">米</span>
                <span className="tag">野菜</span>
                <span className="tag">缶詰</span>
                <span className="tag">調味料</span>
              </div>

              <div className="actions actions--top">
                <button id="btn-message" className="btn btn-primary" onClick={handleMessage}>
                  <span className="material-icons">message</span>&nbsp;メッセージ
                </button>
                <button id="btn-share" className="btn btn-ghost" onClick={handleShare}>
                  <span className="material-icons">share</span>&nbsp;共有
                </button>
                <Link className="btn btn-ghost" to="/map">
                  <span className="material-icons">map</span>&nbsp;地図で表示
                </Link>
              </div>
            </div>
          </div>

          <div className="grid">
            <div>
              <div className="info">
                <div className="info-row">
                  <span className="material-icons">location_on</span>
                  <div>
                    <div className="info-title">東京都新宿区西新宿2-8-1</div>
                    <div className="info-sub">最寄り駅: 新宿駅（徒歩12分）</div>
                  </div>
                </div>

                <div className="info-row">
                  <span className="material-icons">access_time</span>
                  <div>
                    <div className="info-title">営業時間</div>
                    <div className="info-sub">平日 10:00 - 18:00 / 土 10:00 - 15:00 / 日・祝 休み</div>
                  </div>
                </div>

                <div className="info-row">
                  <span className="material-icons">phone</span>
                  <div>
                    <div className="info-title">連絡先</div>
                    <div className="info-sub">03-xxxx-xxxx</div>
                  </div>
                </div>

                <div className="info-row">
                  <span className="material-icons">info</span>
                  <div className="info-text">
                    受け取り条件: 常温保存可能な未開封品を優先して受け付けます。生鮮食品は事前連絡が必要です。
                  </div>
                </div>

                <div className="report">
                  <h3 className="section-title">問題の報告</h3>
                  <form id="report-form" onSubmit={handleReportSubmit}>
                    <textarea
                      id="report-text"
                      required
                      className="report-textarea"
                      placeholder="不適切情報や誤りがある場合はここに記入してください"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                    />
                    <div className="form-actions">
                      <button id="report-submit" className="btn btn-primary" type="submit">
                        送信
                      </button>
                      <button
                        id="report-clear"
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => setReportText('')}
                      >
                        クリア
                      </button>
                    </div>
                  </form>
                </div>

                <div className="reviews">
                  <h3 className="section-title section-title--reviews">ユーザーレビュー</h3>
                  <div className="review">
                    <div className="review-meta">
                      <strong>山田太郎</strong>
                      <span>2025-10-10</span>
                    </div>
                    <div className="review-body">
                      迅速に対応していただき助かりました。受け渡しもスムーズで安心できました。
                    </div>
                  </div>
                  <div className="review">
                    <div className="review-meta">
                      <strong>佐藤花子</strong>
                      <span>2025-09-28</span>
                    </div>
                    <div className="review-body">場所がわかりやすく、スタッフの方も丁寧でした。</div>
                  </div>
                  <div className="more-link">さらに表示する...</div>
                </div>
              </div>
            </div>

            <aside>
              <div className="card card--compact">
                <h4 className="section-title">地図プレビュー</h4>
                <div className="map-preview">ミニマップ（クリックで拡大）</div>

                <h4 className="section-title">提供可能な食材</h4>
                <div className="tag-list tag-list--aside">
                  <span className="tag">缶詰</span>
                  <span className="tag">パスタ</span>
                  <span className="tag">乾麺</span>
                  <span className="tag">ベビーフード</span>
                </div>

                <h4 className="section-title">運営情報</h4>
                <div className="aside-text">
                  NPO法人 みらいフードバンク<br />
                  設立: 2018年 / ボランティア数: 約30名
                </div>

                <h4 className="section-title">安全対策</h4>
                <ul className="safety-list">
                  <li>本人確認済みアカウント</li>
                  <li>レビュー・評価システム</li>
                  <li>運営による情報確認プロセス</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <p>© 2025 食PULL. All Rights Reserved.</p>
          <div className="footer-links">
            <a className="footer-link">プライバシーポリシー</a>
            <a className="footer-link">利用規約</a>
            <a className="footer-link">お問い合わせ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default InformationPage;

