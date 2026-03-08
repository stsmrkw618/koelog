# Claude Code 週次分析プロンプト

以下のように使います:

## 手順

1. `node scripts/fetch-entries.js` を実行
2. 自動生成された `scripts/prompt.txt` の内容をClaude Codeに貼り付ける
3. Claudeが返したJSONを `scripts/results.json` として保存
4. `node scripts/write-back.js` を実行

## prompt.txt のテンプレート

```
以下は1週間分の音声日記の文字起こしです。

--- entries ---
{{entries}}

--- 指示 ---
1. 各エントリー(id付き)に対して:
   - mood: positive / neutral / mixed / negative
   - tags: 1〜3個（例: 仕事, 家族, アイデア, 健康, 趣味, 競馬）

2. 1週間全体に対して:
   - highlight: 3行以内の今週ハイライト（語り口調で、本人が読んで嬉しくなるように）
   - topic_distribution: {"仕事": 62, "家族": 24, ...}（%合計100）
   - insight: 行動パターンや感情の傾向から得られる気づき1つ

以下のJSON形式で出力してください:
{
  "entries": [
    {"id": "uuid", "mood": "positive", "tags": ["仕事", "USJ"]}
  ],
  "weekly_summary": {
    "highlight": "...",
    "mood_sequence": [{"day": "2026-03-02", "mood": "positive"}, ...],
    "topic_distribution": {"仕事": 62, "家族": 24, "アイデア": 14},
    "insight": "..."
  }
}
```

## results.json の例

```json
{
  "entries": [
    {"id": "abc-123", "mood": "positive", "tags": ["仕事", "USJ"]},
    {"id": "def-456", "mood": "neutral", "tags": ["家族"]}
  ],
  "weekly_summary": {
    "highlight": "USJの25周年施策が本格始動。Discover U!!!のローンチを見届け、6月CM提案への手応えを掴んだ1週間だった。",
    "mood_sequence": [
      {"day": "2026-03-02", "mood": "positive"},
      {"day": "2026-03-03", "mood": "positive"},
      {"day": "2026-03-04", "mood": "neutral"},
      {"day": "2026-03-05", "mood": "mixed"},
      {"day": "2026-03-06", "mood": "positive"},
      {"day": "2026-03-07", "mood": "positive"},
      {"day": "2026-03-08", "mood": "positive"}
    ],
    "topic_distribution": {"仕事": 62, "家族": 24, "アイデア": 14},
    "insight": "木曜に疲労のピークが来る傾向。水曜夜のリカバリーがカギ。"
  }
}
```
