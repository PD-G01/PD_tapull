import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import './matching.css';
import '../../global.css';

function MatchingPage() {
  const recommendedProfiles = useMemo(
    () => [
      {
        id: 'hiyori',
        name: 'ひより',
        age: 23,
        role: '看護師',
        organization: '金沢工業大学',
        location: '新宿 在住',
        distance: '14km 以内',
        need: '子ども食堂向けの常温保存できる食材を探しています。',
        tags: ['子ども支援', '平日夕方受取可', '少量OK'],
        avatar: ''
      },
      {
        id: 'sora',
        name: 'そら',
        age: 29,
        role: '地域コーディネーター',
        organization: '港区フードネット',
        location: '品川 在住',
        distance: '8km 以内',
        need: 'お米や缶詰など長期保存が可能な食材を優先募集。',
        tags: ['大量歓迎', '土日受取', '車あり'],
        avatar: ''
      },
      {
        id: 'haru',
        name: 'はる',
        age: 35,
        role: 'NPO代表',
        organization: 'こどもこもんず',
        location: '池袋 在住',
        distance: '20km 以内',
        need: 'ベビーフードやアレルギー対応食品を探しています。',
        tags: ['乳児向け', '平日午前受取', '冷蔵可'],
        avatar: ''
      }
    ],
    []
  );

  const PLACEHOLDER_AVATAR =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#EEF2FF"/>
            <stop offset="1" stop-color="#FCE7F3"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <circle cx="400" cy="390" r="150" fill="#ffffff" opacity="0.85"/>
        <rect x="210" y="560" width="380" height="260" rx="130" fill="#ffffff" opacity="0.85"/>
        <text x="50%" y="92%" text-anchor="middle" font-size="34" fill="#6B7280" font-family="sans-serif">NO IMAGE</text>
      </svg>
    `);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = recommendedProfiles[currentIndex];

  const goNext = () => setCurrentIndex((i) => (i + 1) % recommendedProfiles.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + recommendedProfiles.length) % recommendedProfiles.length);

  const onAvatarError = (e) => {
    e.currentTarget.src = PLACEHOLDER_AVATAR;
  };

  return (
    <div className="container">
      <SiteHeader subtitle="フードドライブマッチング機能への入り口" />

      {/* ===== Mobile: Card ===== */}
      <section className="mobile-match-section">
        <div className="match-card">
          <header className="match-topbar">
            <Link to="/" className="match-back" aria-label="トップへ戻る">
              <span className="material-icons">arrow_back</span>
              戻る
            </Link>

            <div className="match-progress" aria-label="おすすめの進捗">
              {recommendedProfiles.map((p, idx) => (
                <span
                  key={p.id}
                  className={`match-dot ${idx === currentIndex ? 'is-active' : ''}`}
                />
              ))}
            </div>

            <button type="button" className="match-ghost" onClick={goPrev} aria-label="ひとつ前へ">
              <span className="material-icons">undo</span>
            </button>
          </header>

          <div className="match-media">
            <img
              src={currentProfile.avatar || PLACEHOLDER_AVATAR}
              alt={currentProfile.name}
              onError={onAvatarError}
            />
            <div className="match-overlay">
              <div className="match-basic">
                <div className="match-name-row">
                  <span className="match-name">{currentProfile.name}</span>
                  <span className="match-age">{currentProfile.age}</span>
                  <span className="match-verified" title="確認済み">
                    <span className="material-icons">verified</span>
                  </span>
                </div>

                <div className="match-sub">
                  <span className="match-role">{currentProfile.role}</span>
                  <span className="match-sep">・</span>
                  <span className="match-org">{currentProfile.organization}</span>
                </div>

                <div className="match-meta">
                  <span className="match-meta-item">
                    <span className="material-icons">location_on</span>
                    {currentProfile.location}
                  </span>
                  <span className="match-meta-item">
                    <span className="material-icons">near_me</span>
                    {currentProfile.distance}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="match-content">
            <div className="need-card">
              <p className="need-title">探している食材</p>
              <p className="need-text">{currentProfile.need}</p>
            </div>

            <div className="tag-row" aria-label="条件タグ">
              {currentProfile.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ===== 操作性最優先：下部固定 / 大きいタップ領域 / 押した感 ===== */}
          <footer className="match-actions" role="group" aria-label="操作">
            <button
              type="button"
              className="action-btn danger"
              onClick={goNext}
              aria-label="スキップ"
            >
              <span className="material-icons">close</span>
              <span className="action-label">スキップ</span>
            </button>

            <button
              type="button"
              className="action-btn neutral"
              aria-label="詳細"
            >
              <span className="material-icons">info</span>
              <span className="action-label">詳細</span>
            </button>

            <button
              type="button"
              className="action-btn primary"
              onClick={goNext}
              aria-label="申請"
            >
              <span className="material-icons">favorite</span>
              <span className="action-label">申請</span>
            </button>
          </footer>
        </div>
      </section>

      {/* ===== Desktop: List ===== */}
      <section className="desktop-match-section">
        <div className="desktop-match-header">
          <div>
            <p className="section-eyebrow">おすすめの募集相手</p>
            <h2 className="section-title desktop-title">近くで食材を探している利用者一覧</h2>
            <p className="section-subtitle">ニーズが明確な順に表示しています</p>
          </div>

          <Link to="/contributor-match" className="desktop-action-link">
            食材提供フローを見る
            <span className="material-icons">arrow_forward</span>
          </Link>
        </div>

        <div className="desktop-profile-grid">
          {recommendedProfiles.map((profile) => (
            <article key={profile.id} className="desktop-profile-card">
              <div className="desktop-profile-header">
                <img
                  src={profile.avatar || PLACEHOLDER_AVATAR}
                  alt={profile.name}
                  onError={onAvatarError}
                />
                <div className="desktop-profile-headtext">
                  <div className="desktop-profile-name">
                    <p>{profile.name}</p>
                    <span className="age">{profile.age}</span>
                    <span className="mini-verified" title="確認済み">
                      <span className="material-icons">verified</span>
                    </span>
                  </div>

                  <p className="desktop-profile-role">
                    {profile.role} ・ {profile.organization}
                  </p>

                  <p className="desktop-profile-loc">
                    <span className="material-icons">location_on</span>
                    {profile.location}
                    <span className="loc-sep">/</span>
                    {profile.distance}
                  </p>
                </div>
              </div>

              <div className="need-card desktop-need">
                <p className="need-title">探している食材</p>
                <p className="need-text">{profile.need}</p>
              </div>

              <div className="tag-row">
                {profile.tags.map((tag) => (
                  <span key={`${profile.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="desktop-profile-actions">
                <button type="button" className="outline-btn">詳細を見る</button>
                <button type="button" className="primary-btn">マッチング申請</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Link to="/" className="back-link">
        <span className="material-icons">arrow_back</span>
        トップページへ戻る
      </Link>

      <SiteFooter links={[]} />
    </div>
  );
}

export default MatchingPage;
