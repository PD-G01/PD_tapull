import React, { useState, useEffect, useRef } from "react";
import { db, auth, storage } from '../../utils/firebase'; // storageを追加
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Storage用関数を追加
import { onAuthStateChanged } from "firebase/auth";
import "./Provide.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const geocodeLocation = async (address) => {
    if (!address) return [0, 0];
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return [lat, lng];
        }
        return [0, 0];
    } catch (error) {
        console.error("ジオコーディングエラー:", error);
        return [0, 0];
    }
};

export default function ProvidePage() {
    const [userId, setUserId] = useState("");
    const [foodName, setFoodName] = useState("");
    const [foodInfo, setFoodInfo] = useState("");
    const [location, setLocation] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    
    // 表示用プレビュー(DataURL)とアップロード用ファイル実体(File)を分ける
    const [picturePreview, setPicturePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null); // 追加: アップロード用

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const fileInputRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user = auth.currentUser) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId("");
                setMessage("エラー: ログインしていません。");
            }
        });
        return () => unsubscribe();
    }, []);

    const handleFileChange = (e) => {
        const f = e.target.files?.[0] ?? null;
        if (f) {
            setImageFile(f); // ファイル実体を保存
            const reader = new FileReader();
            reader.onload = () => setPicturePreview(reader.result);
            reader.readAsDataURL(f);
        } else {
            setImageFile(null);
            setPicturePreview(null);
        }
    };

    const parseTags = (input) => {
        return input.split(",").map(s => s.trim()).filter(Boolean);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage("");

        // バリデーション
        if (!userId) {
            setMessage("ログインが必要です。");
            setSubmitting(false);
            return;
        }
        // imageFileのチェックに変更
        if (!foodName.trim() || !location.trim() || !imageFile) {
            setMessage("必須項目（食品名・場所・写真）をすべて入力してください。");
            setSubmitting(false);
            return;
        }
        
        try {
            // 1. 画像アップロード処理
            let avatarURL = null;
            if (imageFile) {
                try {
                    const uploadPromise = (async () => {
                        // ファイル名を一意にするためタイムスタンプを付与
                        const storageRef = ref(storage, `food_images/${userId}/${Date.now()}_${imageFile.name}`);
                        await uploadBytes(storageRef, imageFile);
                        return await getDownloadURL(storageRef);
                    })();

                    // 10秒でタイムアウト
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('画像アップロードがタイムアウトしました')), 10000)
                    );

                    avatarURL = await Promise.race([uploadPromise, timeoutPromise]);
                } catch (storageError) {
                    console.warn('画像アップロードエラー:', storageError);
                    throw new Error("画像のアップロードに失敗しました。再試行してください。");
                }
            }

            // 2. ジオコーディング
            const finalLocationGeo = await geocodeLocation(location);
            
            // 3. Firestoreへ保存
            const offerDoc = {
                user_id: userId,
                food_name: foodName,
                food_infomation: foodInfo,
                food_picture: avatarURL, // StorageのURLを保存
                location: location,
                location_geo: finalLocationGeo,
                tags: parseTags(tagsInput),
                status: "available",
                created_at: serverTimestamp()
            };

            await addDoc(collection(db, "offer"), offerDoc);
            
            // フォームのリセット処理
            setFoodName("");
            setFoodInfo("");
            setLocation("");
            setTagsInput("");
            setPicturePreview(null);
            setImageFile(null); // ファイル実体もリセット
            
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            setMessage("食品情報を登録しました！");
            
        } catch (err) {
            console.error("登録エラー:", err);
            setMessage(`登録失敗: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="provide-container" style={{ padding: "1rem" }}>
            <section className="flow-section" style={{ maxWidth: 820, margin: "1.25rem auto" }}>
                <div style={{ padding: "1.25rem" }}>
                    <h2 className="feature-title">食品を提供する</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <label className="section-eyebrow">食品名（必須）</label>
                        <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="例: お米 5kg" required />

                        <label className="section-eyebrow">詳細情報</label>
                        <textarea value={foodInfo} onChange={(e) => setFoodInfo(e.target.value)} placeholder="賞味期限や状態など" rows={3} />

                        <label className="section-eyebrow">受け渡し場所（必須）</label>
                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例: 金沢駅西口付近" required />

                        <label className="section-eyebrow">タグ</label>
                        <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="例: 野菜, 急募" />

                        <label className="section-eyebrow">食品の写真（必須）</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            ref={fileInputRef} 
                            required 
                        />
                        
                        {picturePreview && (
                            <div style={{ marginTop: "10px" }}>
                                <img src={picturePreview} alt="preview" style={{ height: "180px", borderRadius: "8px", objectFit: "cover" }} />
                            </div>
                        )}

                        <button type="submit" className="primary-btn" disabled={submitting} style={{ marginTop: "1.5rem", width: "100%" }}>
                            {submitting ? "登録中..." : "登録する"}
                        </button>
                    </form>
                    
                    {message && (
                        <p className="message" style={{ 
                            marginTop: "1rem", 
                            padding: "0.5rem", 
                            backgroundColor: message.includes("成功") || message.includes("登録しました") ? "#e6fffa" : "#fff5f5",
                            color: message.includes("成功") || message.includes("登録しました") ? "#2c7a7b" : "#c53030",
                            borderRadius: "4px",
                            textAlign: "center"
                        }}>
                            {message}
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}