import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import "./matching.css";
import "../../global.css";

function MatchingPage() {
  const [recommendedProfiles, setRecommendedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // 1. offerコレクションから全ドキュメントを取得
        const offerSnapshot = await getDocs(collection(db, "offer"));

        if (offerSnapshot.empty) {
          setRecommendedProfiles([]);
          setLoading(false);
          return;
        }

        // 2. 各offerに関連するuserドキュメントを並列で取得
        const profilePromises = offerSnapshot.docs.map(async (offerDoc) => {
          const offerData = offerDoc.data();
          const userId = offerData.user_id;

          let userData = {};
          if (userId) {
            // コレクション名は画像通り"user"を指定
            const userDocRef = doc(db, "user", userId);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              userData = userDocSnap.data();
            }
          }

          // 3. offerとuserのデータを統合
          // 画像のフィールド名(food_infomation, user-name等)に正確に合わせる
          return {
            id: offerDoc.id,
            name: userData["user-name"] || "名前なし",
            foodName: offerData.food_name || "食材名なし",
            need: offerData.food_infomation || "情報なし", // 画像の綴り(rなし)に対応
            location: offerData.location || "場所不明",
            avatar: offerData.food_picture || userData.image || "", 
            tags: offerData.tags || [],
            // 共通項目（必要に応じて初期値を設定）
          };
        });

        const combinedProfiles = await Promise.all(profilePromises);
        setRecommendedProfiles(combinedProfiles);
      } catch (err) {
        console.error("データ結合エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) {
    return <div className="container">読み込み中...</div>;
  }

  if (recommendedProfiles.length === 0) {
    return <div className="container">プロフィールが見つかりません</div>;
  }

  const currentProfile = recommendedProfiles[currentIndex];

  const handleSwipe = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % recommendedProfiles.length);
  };

  return (
    <div className="container">
      <SiteHeader subtitle="フードドライブマッチング機能への入り口" />

      {/* Mobile 表示 */}
      <section className="mobile-match-section">
        <div className="match-card">
          <div className="match-card-image">
            {currentProfile.avatar ? (
              <img src={currentProfile.avatar} alt={currentProfile.name} />
            ) : (
              <div className="no-image-placeholder">画像なし</div>
            )}
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
            <p><strong>募集内容:</strong> {currentProfile.foodName}</p>
            <p>{currentProfile.need}</p>
            <div className="match-tags">
              {currentProfile.tags.map((tag, index) => (
                <span key={`${currentProfile.id}-tag-${index}`} className="match-tag">
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

      {/* Desktop 表示 */}
      <section className="desktop-match-section">
        <div className="desktop-match-header">
          <div>
            <p className="section-eyebrow">おすすめの募集相手</p>
            <h2 className="section-title desktop-title">近くで食材を探している利用者一覧</h2>
          </div>
          <Link to="/provide" className="desktop-action-link">
            食材提供者はこちら
            <span className="material-icons">arrow_forward</span>
          </Link>
        </div>

        <div className="desktop-profile-grid">
          {recommendedProfiles.map((profile) => (
            <article key={profile.id} className="desktop-profile-card">
              <div className="desktop-profile-header">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} />
                ) : (
                  <div className="no-image-placeholder">画像なし</div>
                )}
                <div>
                  <div className="desktop-profile-name">
                    <p>{profile.name}</p>
                    <span>{profile.age}</span>
                  </div>
                  <p className="desktop-profile-loc">
                    <span className="material-icons">location_on</span>
                    {profile.location}
                  </p>
                </div>
              </div>
              <p className="desktop-profile-need">
                <strong>{profile.foodName}</strong>: {profile.need}
              </p>
              <div className="desktop-profile-tags">
                {profile.tags.map((tag, index) => (
                  <span key={`${profile.id}-${tag}-${index}`}>{tag}</span>
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