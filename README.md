# Mamapa Zagreb

ザグレブの子連れスポット（おむつ交換台・プレイエリア・禁煙カフェなど）を、ママ・パパが投稿して共有するWebアプリです。クロアチア語・英語対応。

- 見るだけ：ログイン不要、誰でも
- 投稿：Googleアカウントでログインした人
- 登録方法：Googleマップの共有リンクを貼る → 店名・住所・位置・区が自動で入る → カテゴリと口コミ・写真を選ぶ

## フォルダの中身

| 場所 | 役割 |
|---|---|
| `public/` | アプリの画面（スマホでもPCでも動きます） |
| `public/config.js` | Supabaseの接続先（2か所だけ書き換え） |
| `functions/api/resolve.js` | Googleマップのリンクから店名・位置を読み取る処理 |
| `supabase/schema.sql` | データベースの設定（Supabaseに貼って実行） |

## 公開までの手順

### 1. Supabase：データベースを準備
1. Supabaseのプロジェクトを開き、左メニューの **SQL Editor** → **New query**
2. `supabase/schema.sql` の中身を全部貼り付けて **Run**（「Success」と出ればOK）
3. **Project Settings → API** で次の2つをコピーし、`public/config.js` に貼る
   - Project URL → `SUPABASE_URL`
   - anon / public のキー → `SUPABASE_ANON_KEY`
   （anonキーは公開しても大丈夫なキーです。service_role のキーは絶対に貼らないでください）

### 2. GitHub：コードを置く
1. github.com 右上の **+ → New repository**、名前は `mamapa`
2. 作成後の画面で **uploading an existing file** をクリック
3. このフォルダの中身（`public` `functions` `supabase` `README.md`）をまとめてドラッグ → **Commit changes**

### 3. Cloudflare：公開
1. Cloudflareのダッシュボード → **Workers & Pages → Create → Pages → Connect to Git**
2. GitHubと連携して `mamapa` を選ぶ
3. 設定：Framework preset **None**／Build command **空欄**／Build output directory **public**
4. **Save and Deploy** → `https://mamapa-xxx.pages.dev` のようなURLができます

### 4. Googleログインを有効にする
1. console.cloud.google.com で新しいプロジェクトを作成（無料、カード不要）
2. **APIs & Services → OAuth consent screen**：External、アプリ名「Mamapa Zagreb」、自分のメールを入力
3. **Credentials → Create credentials → OAuth client ID**：種類は **Web application**
   - Authorized redirect URIs に、Supabaseの **Authentication → Providers → Google** 画面に表示される Callback URL を貼る
4. 表示された Client ID と Client Secret を、Supabaseの Google 設定に貼って有効化
5. Supabaseの **Authentication → URL Configuration**
   - Site URL：手順3でできた `https://…pages.dev`
   - Redirect URLs：同じURLを追加

## 無料プランでの注意
- Supabaseの無料プランは、1週間ほど誰も使わないと一時停止します。ダッシュボードの「Restore」で再開できます。
- 写真はアップロード時に自動で縮小します（1枚あたり最大3MB）。
- 地図は OpenStreetMap を使っています。画面下の著作権表示は消さないでください。
- Googleの短縮リンクの読み取りはGoogleの公式機能ではありません。読み取れないときは、店名と住所を入力して地図で場所を指定する画面に切り替わります。
