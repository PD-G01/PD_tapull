import { useEffect, useRef } from 'react';
import '../css/index.css';
import '../css/view_map.css';

function ViewMapPage() {
  const mapRef = useRef(null);

  useEffect(() => {
    // Google Maps APIの読み込み
    const loadGoogleMaps = () => {
      if (window.google) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDwJ6Lhxfb9hnhAxFD484PEpxCC9wPV4dI&callback=initMap&language=ja`;
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (mapRef.current && window.google) {
        new window.google.maps.Map(mapRef.current, {
          center: { lat: 35.6812, lng: 139.7671 }, // 東京駅
          zoom: 13
        });
      }
    };

    loadGoogleMaps();

    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <img alt="食PULL Logo" className="logo-img" src="/image/食pull.png" />
            <h1 className="logo-title">食PULL</h1>
          </div>
        </div>
      </header>

      <main className="map-container">
        <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
        
        <div className="control-panel">
          <div className="search-bar">
            <span className="material-icons">search</span>
            <input type="text" placeholder="場所を検索" />
          </div>
          
          <div className="filter-panel">
            <button className="filter-button">
              <span className="material-icons">filter_list</span>
              フィルター
            </button>
          </div>
        </div>

        <div className="location-popup" style={{ display: 'none' }}>
          <div className="popup-content">
            <div className="popup-header">
              <h3>場所の詳細</h3>
              <button className="close-button">
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="location-details">
              <div className="location-image">
                <img src="/image/placeholder.jpg" alt="場所の画像" />
              </div>
              <h4 className="location-name">フードバンク名称</h4>
              <div className="location-info">
                <p className="location-address">
                  <span className="material-icons">location_on</span>
                  住所が表示されます
                </p>
                <p className="location-time">
                  <span className="material-icons">access_time</span>
                  営業時間: 9:00-18:00
                </p>
              </div>
              <div className="food-info">
                <h5>提供可能な食材</h5>
                <div className="food-tags">
                  <span className="food-tag">米</span>
                  <span className="food-tag">野菜</span>
                  <span className="food-tag">缶詰</span>
                </div>
              </div>
              <div className="action-buttons">
                <button className="contact-button primary-button">
                  <span className="material-icons">message</span>
                  連絡する
                </button>
                <button className="share-button secondary-button">
                  <span className="material-icons">share</span>
                  共有
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ViewMapPage;

