import { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import './matching.css';
import '../../global.css';

function MatchingPage() {
  const recommendedProfiles = [
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
      // ダミー画像URL
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
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
      avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80'
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
      avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = recommendedProfiles[currentIndex];

  const handleSwipe = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % recommendedProfiles.length);
  };

  return (
    <div className="container match-page-container">
      {/* PC表示時のみヘッダーを表示 */}
      <div className="desktop-only">
        <SiteHeader subtitle="フードドライブマッチング機能への入り口" />
      </div>

      {/* Mobile: Tinder-like card */}
      <section className="mobile-match-section">
        {/* カードエリア */}
        <div className="card-container">
          <div className="match-card">
            <div className="match-card-image-wrapper">
              <img src={currentProfile.avatar} alt={currentProfile.name} />
              <div className="match-card-gradient"></div>
              
              <div className="match-card-content">
                <div className="match-profile-main">
                  <div className="match-name-row">
                    <h2 className="match-name">{currentProfile.name}</h2>
                    <span className="match-age">{currentProfile.age}</span>
                    <span className="verified-badge">
                      <span className="material-icons">verified</span>
                    </span>
                  </div>
                  
                  <p className="match-role">{currentProfile.role}</p>
                  
                  <div className="match-meta-info">
                    <span className="meta-item">
                      <span className="material-icons">school</span>
                      {currentProfile.organization}
                    </span>
                  </div>
                </div>

                <div className="match-details">
                  <div className="match-tags">
                    {currentProfile.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="match-tag">{tag}</span>
                    ))}
                  </div>
                  <p className="match-need-text">
                    {currentProfile.need}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作エリア */}
        <div className="match-action-bar">
          <button type="button" className="action-btn rewind" onClick={handleSwipe} aria-label="戻る">
            <span className="material-icons">replay</span>
          </button>
          
          <button type="button" className="action-btn dislike" onClick={handleSwipe} aria-label="スキップ">
            <span className="material-icons">close</span>
          </button>
          
          <button type="button" className="action-btn super-like" onClick={handleSwipe} aria-label="スーパーライク">
            <span className="material-icons">star</span>
          </button>
          
          <button type="button" className="action-btn like" onClick={handleSwipe} aria-label="いいね">
            <span className="material-icons">favorite</span>
          </button>
          
          <button type="button" className="action-btn flash" aria-label="ブースト">
            <span className="material-icons">bolt</span>
          </button>
        </div>
      </section>

      {/* Desktop: Grid List */}
      <section className="desktop-match-section">
        <div className="desktop-match-header">
          <div className="header-text-group">
            <p className="section-eyebrow">おすすめの募集相手</p>
            <h2 className="section-title">近くで食材を探している利用者一覧</h2>
          </div>
          <Link to="/contributor-match" className="desktop-action-link">
            食材提供フローを見る
            <span className="material-icons">arrow_forward</span>
          </Link>
        </div>

        <div className="desktop-profile-grid">
          {recommendedProfiles.map((profile) => (
            <article key={profile.id} className="desktop-profile-card">
              <div className="card-top">
                <img src={profile.avatar} alt={profile.name} className="card-avatar"/>
                <div className="card-header-info">
                  <div className="card-name-row">
                    <h3>{profile.name}</h3>
                    <span className="card-age">{profile.age}</span>
                  </div>
                  <p className="card-role">{profile.role}</p>
                  <p className="card-org">{profile.organization}</p>
                </div>
              </div>
              
              <div className="card-body">
                <div className="card-tags">
                  {profile.tags.map((tag) => (
                    <span key={`${profile.id}-${tag}`}>{tag}</span>
                  ))}
                </div>
                <div className="card-need-box">
                  <p>{profile.need}</p>
                </div>
                <p className="card-location">
                  <span className="material-icons">location_on</span>
                  {profile.location} ({profile.distance})
                </p>
              </div>

              <div className="card-actions">
                <button type="button" className="btn-outline">詳細</button>
                <button type="button" className="btn-primary">マッチング申請</button>
              </div>
            </article>
          ))}
        </div>

        <Link to="/" className="back-link">
          <span className="material-icons">arrow_back</span>
          トップページへ戻る
        </Link>
      </section>
      
      <div className="desktop-only">
        <SiteFooter links={[]} />
      </div>
    </div>
  );
}

export default MatchingPage;