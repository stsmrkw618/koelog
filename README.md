# 🎙️ KoeLog（コエログ）

> **「30秒の声が、1週間の物語になる」**

毎日30秒〜1分の音声メモをスマホで録るだけ。週末にAIが1週間分を要約し、「あなたの今週」をハイライトリールとして届ける声日記アプリ。

## デモ

🔗 https://koelog-kappa.vercel.app

---

## アプリの概要

### 3つの画面

| 画面 | 説明 |
|------|------|
| 🎙️ **録音**（ホーム） | ワンタップで音声録音。Web Speech APIによるリアルタイム文字起こし付き |
| 📅 **履歴**（カレンダー） | 月間カレンダーに感情カラードット。日付タップでエントリー詳細 + 音声再生 |
| ✨ **週報**（ハイライト） | AIが生成した週次ハイライト・ムード推移・トピック分布・気づき |

### 仕組み

```
【日常：スマホブラウザ】
  録音 → リアルタイム文字起こし → Supabaseに保存

【週末：PC上のClaude Code】
  1週間分のエントリー取得 → Claude AIで感情分析・要約 → Supabaseに書き戻し
```

### 特徴

- **課金ゼロ** — Supabase無料枠 + Vercel無料枠 + Claude MAX契約のみ
- **パスワード不要** — メールのマジックリンクでログイン
- **PWA対応** — スマホのホーム画面に追加してアプリライクに使える
- **プライバシー重視** — RLS（行レベルセキュリティ）でデータは本人のみアクセス可能

---

## セットアップ

### 前提条件

- Node.js 18+
- Supabaseアカウント（無料枠でOK）
- Claude MAX契約（週次分析に使用）

### 1. リポジトリをクローン

```bash
git clone https://github.com/stsmrkw618/koelog.git
cd koelog
npm install
```

### 2. Supabaseの設定

Supabase Dashboardで以下を実行:

1. **SQL Editor** で `scripts/setup.sql` の内容を実行（テーブル・RLS・Storageバケットを作成）
2. **Settings → API** から `Project URL` と `anon public key` をコピー

### 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Supabase認証の設定

Supabase Dashboard → **Authentication → URL Configuration**:

- **Redirect URLs** に本番URLを追加（例: `https://koelog-kappa.vercel.app`）

### 5. 起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

---

## 日常の使い方（スマホ）

1. ブラウザで https://koelog-kappa.vercel.app にアクセス
2. メールアドレスを入力 → 届いたリンクをクリックしてログイン
3. 🎙️ ボタンをタップして録音開始
4. 話し終わったらタップで停止
5. 文字起こしを確認・修正 →「保存する」

**ポイント:**
- 最大3分まで録音可能（長すぎると続かないので短めがおすすめ）
- Web Speech APIが使えないブラウザでは、録音後に手動でテキスト入力可能
- 📅 タブで過去の記録を振り返れる

---

## 週末バッチ処理の使い方（PC）

毎週末、PCのClaude Code上で以下の3ステップを実行します。

### Step 1: エントリーの取得

```bash
cd koelog/scripts
node fetch-entries.js
```

今週分のエントリーがSupabaseから取得され、2つのファイルが生成されます:

- `entries.json` — 生データ（write-back時に使用）
- `prompt.txt` — Claude Codeに貼り付ける分析プロンプト

**特定の週を指定する場合:**

```bash
node fetch-entries.js --week 2026-W10
```

### Step 2: Claude Codeで分析

`prompt.txt` の内容をClaude Codeに貼り付けます。Claudeが以下のJSON形式で結果を返します:

```json
{
  "entries": [
    {"id": "uuid", "mood": "positive", "tags": ["仕事", "USJ"]}
  ],
  "weekly_summary": {
    "highlight": "今週のハイライト文...",
    "mood_sequence": [
      {"day": "2026-03-02", "mood": "positive"},
      {"day": "2026-03-03", "mood": "neutral"}
    ],
    "topic_distribution": {"仕事": 62, "家族": 24, "アイデア": 14},
    "insight": "気づきのテキスト..."
  }
}
```

このJSONを `scripts/results.json` として保存します。

### Step 3: Supabaseに書き戻し

```bash
node write-back.js
```

以下が自動で実行されます:
- 各エントリーの `mood` と `tags` が更新される
- 週次サマリーが `weekly_summaries` テーブルに保存される

**確認:** アプリの ✨ 週報タブに反映されます。

### 一括実行の流れ

```bash
cd koelog/scripts

# ① 取得
node fetch-entries.js

# ② prompt.txt をClaude Codeに貼り付け → 返ってきたJSONを results.json に保存

# ③ 書き戻し
node write-back.js
```

所要時間: 約5分

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| デプロイ | Vercel |
| DB / Auth | Supabase（無料枠） |
| 音声ストレージ | Supabase Storage（無料枠1GB） |
| 文字起こし | Web Speech API（ブラウザネイティブ・無料） |
| AI要約 | Claude Code（MAX契約内・バッチ処理） |
| 音声録音 | MediaRecorder API |
| 波形表示 | Web Audio API (AnalyserNode) |
| UI | Tailwind CSS + Framer Motion |

---

## ファイル構成

```
koelog/
├── app/
│   ├── layout.tsx              # ダークテーマ + フォント + PWAメタデータ
│   ├── page.tsx                # 録音画面（ホーム）
│   ├── globals.css             # カスタムCSS変数 + アニメーション
│   ├── calendar/page.tsx       # カレンダー振り返り画面
│   ├── highlights/page.tsx     # 週次ハイライト画面
│   └── components/
│       ├── Auth.tsx            # マジックリンク認証UI
│       ├── AuthProvider.tsx    # 認証状態管理
│       ├── BottomNav.tsx       # 3タブナビゲーション
│       ├── Recorder.tsx        # 録音 + 文字起こし + 保存
│       ├── WaveVisualizer.tsx  # Canvas波形描画
│       ├── Calendar.tsx        # 月間カレンダー
│       ├── EntryCard.tsx       # エントリー詳細カード
│       ├── WeeklySummary.tsx   # 週次ハイライトリール
│       ├── MoodBar.tsx         # ムード絵文字行
│       └── TopicChart.tsx      # トピック分布バー
├── lib/
│   ├── supabase.ts             # Supabaseクライアント + 型定義
│   ├── recorder.ts             # MediaRecorder + Web Audioユーティリティ
│   └── speech.ts               # Web Speech APIラッパー
├── scripts/
│   ├── setup.sql               # Supabase初期セットアップSQL
│   ├── fetch-entries.js        # 週次エントリー取得
│   ├── analyze-prompt.md       # 分析プロンプトの説明
│   └── write-back.js           # 分析結果のSupabase書き戻し
├── public/
│   ├── manifest.json           # PWA設定
│   └── icon.svg                # アプリアイコン
└── .env.local                  # 環境変数（git管理外）
```

---

## データモデル

### entries（日次エントリー）

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| recorded_at | timestamptz | 録音日時 |
| audio_url | text | 音声ファイルURL |
| duration_seconds | integer | 録音時間（秒） |
| transcript | text | 文字起こしテキスト |
| mood | text | 感情（unanalyzed/positive/neutral/mixed/negative） |
| tags | text[] | タグ（例: 仕事, 家族） |

### weekly_summaries（週次サマリー）

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| week_start | date | 週の開始日（月曜） |
| week_end | date | 週の終了日（日曜） |
| highlight | text | 3行ハイライト |
| mood_sequence | jsonb | 曜日ごとのムード配列 |
| topic_distribution | jsonb | トピック分布（%） |
| insight | text | AIの気づき |
| entry_count | integer | その週のエントリー数 |

---

## ムードカラー

| ムード | 色 | 絵文字 |
|--------|------|------|
| positive | 🟢 #4ADE80 | 😊 |
| neutral | 🔵 #60A5FA | 😐 |
| mixed | 🟡 #FBBF24 | 🤔 |
| negative | 🔴 #F87171 | 😔 |
| unanalyzed | ⚪ #6B7280 | ⏳ |

---

## ライセンス

MIT
