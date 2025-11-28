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
      //avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=720&q=80'
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
      //avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=720&q=80'
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
      // avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=720&q=80'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = recommendedProfiles[currentIndex];

  const handleSwipe = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % recommendedProfiles.length);
  };

  return (
    <div className="container">
      <SiteHeader subtitle="フードドライブマッチング機能への入り口" />

      {/* Mobile: Tinder-like card */}
      <section className="mobile-match-section">
        <div className="match-card">
          <div className="match-card-image">
            <img src={currentProfile.avatar} alt={currentProfile.name} />
            <div className="match-card-overlay">
              <div className="match-card-basic">
                <div className="match-name-line">
                  <p className="match-name">{currentProfile.name}</p>
                  <span className="match-age">{currentProfile.age}</span>
                  <span className="verified-dot">
                    <span className="material-icons">verified</span>
                  </span>
                </div>
                <p className="match-role">{currentProfile.role}</p>
                <p className="match-org">
                  <span className="material-icons">school</span>
                  {currentProfile.organization}
                </p>
                <p className="match-location">
                  <span className="material-icons">location_on</span>
                  {currentProfile.location}
                </p>
                <p className="match-distance">
                  <span className="material-icons">near_me</span>
                  {currentProfile.distance}
                </p>
              </div>
            </div>
          </div>
          <div className="match-need">
            <p>{currentProfile.need}</p>
            <div className="match-tags">
              {currentProfile.tags.map((tag) => (
                <span key={tag} className="match-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="match-actions">
            <button type="button" className="match-action rewind" onClick={handleSwipe}>
              <span className="material-icons">replay</span>
            </button>
            <button type="button" className="match-action dislike" onClick={handleSwipe}>
              <span className="material-icons">close</span>
            </button>
            <button type="button" className="match-action info">
              <span className="material-icons">info</span>
            </button>
            <button type="button" className="match-action like" onClick={handleSwipe}>
              <span className="material-icons">favorite</span>
            </button>
            <button type="button" className="match-action flash" onClick={handleSwipe}>
              <span className="material-icons">bolt</span>
            </button>
          </div>
        </div>
      </section>

      {/* Desktop: list of recommendations */}
      <section className="desktop-match-section">
        <div className="desktop-match-header">
          <div>
            <p className="section-eyebrow">おすすめの募集相手</p>
            <h2 className="section-title desktop-title">近くで食材を探している利用者一覧</h2>
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
                <img src={profile.avatar} alt={profile.name} />
                <div>
                  <div className="desktop-profile-name">
                    <p>{profile.name}</p>
                    <span>{profile.age}</span>
                  </div>
                  <p className="desktop-profile-role">{profile.role} ・ {profile.organization}</p>
                  <p className="desktop-profile-loc">
                    <span className="material-icons">location_on</span>
                    {profile.location} / {profile.distance}
                  </p>
                </div>
              </div>
              <p className="desktop-profile-need">{profile.need}</p>
              <div className="desktop-profile-tags">
                {profile.tags.map((tag) => (
                  <span key={`${profile.id}-${tag}`}>{tag}</span>
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

