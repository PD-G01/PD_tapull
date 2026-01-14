import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader';
import '../../global.css';
import './view_map.css';

function ViewMapPage() {
  const mapRef = useRef(null);
  const location = useLocation();
  const { location: targetLocation, userName } = location.state || {};

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      // 基本の地図表示（ルート案内がない場合のデフォルト）
      const defaultPos = { lat: 36.52836, lng: 136.62714 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultPos,
        zoom: 15,
      });

      if (targetLocation) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };

              map.setCenter(pos);

              // 現在地に青いドットのマーカー
              new window.google.maps.Marker({
                position: pos,
                map: map,
                title: 'あなたの現在地',
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                      <circle cx="12" cy="12" r="4" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(24, 24),
                },
              });

              const geocoder = new window.google.maps.Geocoder();
              const directionsService = new window.google.maps.DirectionsService();
              const directionsRenderer = new window.google.maps.DirectionsRenderer();
              directionsRenderer.setMap(map);

              // ルートの詳細を表示するパネルをセット
              const panel = document.getElementById('directions-panel');
              if (panel) {
                directionsRenderer.setPanel(panel);
              }

              geocoder.geocode({ address: targetLocation }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  new window.google.maps.Marker({
                    position: results[0].geometry.location,
                    map: map,
                    title: userName || '目的地',
                  });

                  directionsService.route(
                    {
                      origin: pos,
                      destination: results[0].geometry.location,
                      travelMode: window.google.maps.TravelMode.DRIVING,
                    },
                    (result, status) => {
                      if (status === 'OK') {
                        directionsRenderer.setDirections(result);
                      }
                    }
                  );
                } else {
                  alert('目的地の座標を取得できませんでした。住所を確認してください。');
                  console.error('Geocode was not successful for the following reason: ' + status);
                }
              });
            },
            () => {
              console.warn('現在地の取得に失敗しました');
            }
          );
        }
      }
    };

    const loadGoogleMaps = () => {
      if (window.google) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap&language=ja`;
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, [targetLocation, userName]);

  return (
    <div className="app-container">
      <SiteHeader subtitle={null} />

      <main className="map-container">
        <div id="map" ref={mapRef} style={{ width: '100%', height: '500px' }}></div>

        <div className="location-popup" style={{ display: 'none' }}>
          <div className="popup-content">
            <div className="popup-header">
              <h3>場所の詳細</h3>
              <button className="close-button">
                <span className="material-icons">close</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ViewMapPage;