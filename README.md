## 開発フロー（重要）

### ブランチの作成と切り替え

**重要：直接 `main` ブランチで作業しないでください！**

#### 作業開始前に必ずブランチを作成

```bash
# 最新のdevelopブランチに移動
git checkout develop

# 最新の変更を取得
git pull origin develop

# 新しいブランチを作成して切り替え
git checkout -b feature/あなたの名前-機能名
# 例: git checkout -b feature/page
```

#### ブランチ名の命名規則

- `feature/機能名` （新機能の場合）
  - 例: `feature/login`
  - 例: `feature/registration`
  - 例: `feature/home-page`

- `fix/名前-修正内容` （バグ修正の場合）
  - 例: `fix/login-error`
  - 例: `fix/button-style`
  - 例: `fix/responsive-design`

### 作業の進め方

#### 1. コードを書く

#### 2. 変更をステージング

```bash
# 特定のファイルを追加
git add ファイル名

# すべての変更を追加（慎重に！）
git add .
```

#### 3. コミット

```bash
git commit -m "わかりやすいコミットメッセージ"
# 例: git commit -m "ログイン画面のHTMLを作成"
```

#### 4. プッシュ

```bash
git push origin ブランチ名
```

#### 5. プルリクエスト作成

- GitHubのWebページでプルリクエストを作成
- チームメンバーにレビューを依頼

## チーム開発のルール

### コミットメッセージの書き方

- **日本語OK**
- **何をしたかを明確に**

良い例：

- `ログイン画面のHTMLとCSSを作成`
- `ユーザー登録機能のバグを修正`
- `READMEに開発手順を追加`

悪い例：

- `修正`
- `とりあえず`
- `test`

### プルリクエストのルール

1. **必ずレビューを受ける**
2. **機能ごとに小さく分割**
3. **説明を詳しく書く**
