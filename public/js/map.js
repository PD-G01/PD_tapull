// Google Maps が読み込まれたら呼ばれるグローバル関数
window.initMap = function() {
    // 初期座標を 36°31'42.1"N, 136°37'37.7"E
    const center = { lat: 36.5283611, lng: 136.6271389 };
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center,
        mapTypeId: 'roadmap'
    });

    // マーカー管理用
    const markers = [];

    // ← ここを東京のダミーから置き換え
    const placesData = [
        // 初期表示用にセンター付近のサンプル
        { id: 1, pos: { lat: 36.5283611, lng: 136.6271389 }, title: 'フードバンク みらい', tags: ['米','缶詰'] }
    ];

    // マーカー作成
    placesData.forEach(p => {
        const m = new google.maps.Marker({
            position: p.pos,
            map,
            title: p.title
        });
        m._meta = p; // フィルタ用メタ情報を保持
        markers.push(m);
    });

    // Places Autocomplete（検索）
    const input = document.querySelector('.search-bar input');
    if (window.google && google.maps.places && input) {
        const ac = new google.maps.places.Autocomplete(input, { fields: ['geometry','name','formatted_address'] });
        ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (place.geometry && place.geometry.location) {
                map.panTo(place.geometry.location);
                map.setZoom(16);
            }
        });
    }

    // 簡易フィルター関数（タグ配列で絞る例）
    function applyFilter(selectedTags = []) {
        markers.forEach(m => {
            const has = selectedTags.length === 0 || selectedTags.some(t => m._meta.tags.includes(t));
            m.setMap(has ? map : null);
        });
    }

    // フィルタUIのイベント（例: チェックボックスに data-tag 属性をつける）
    document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const selected = Array.from(document.querySelectorAll('.filter-panel input[type="checkbox"]:checked'))
                .map(i => i.dataset.tag);
            applyFilter(selected);
        });
    });

    // ...existing code...
};
// ...existing code...