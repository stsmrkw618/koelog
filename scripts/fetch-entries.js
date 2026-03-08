/**
 * fetch-entries.js
 * Supabaseから指定週のentriesを取得し、JSONファイルに出力する
 *
 * Usage:
 *   node scripts/fetch-entries.js --week 2026-W10
 *   node scripts/fetch-entries.js  (今週分を取得)
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- 環境変数の読み込み (.env.local) ---
import { readFileSync } from "fs";
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const [key, ...vals] = line.split("=");
  if (key && vals.length) env[key.trim()] = vals.join("=").trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- 週の開始・終了を計算 ---
function getWeekRange(weekStr) {
  if (weekStr) {
    // "2026-W10" 形式
    const [yearStr, wStr] = weekStr.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(wStr);

    // ISO 8601: Week 1 = week containing Jan 4
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7; // Monday=1 ... Sunday=7
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  }

  // Default: 今週
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// --- メイン処理 ---
async function main() {
  // 引数パース
  const args = process.argv.slice(2);
  let weekStr = null;
  const weekIdx = args.indexOf("--week");
  if (weekIdx !== -1 && args[weekIdx + 1]) {
    weekStr = args[weekIdx + 1];
  }

  const { start, end } = getWeekRange(weekStr);
  const label = weekStr || `${start.toISOString().slice(0, 10)} ~ ${end.toISOString().slice(0, 10)}`;

  console.log(`📅 対象期間: ${label}`);
  console.log(`   ${start.toISOString()} ~ ${end.toISOString()}`);

  // Supabaseからentries取得（RLSがあるのでサービスキーが必要な場合あり）
  // ここではanon keyで取得 — 必要なら事前にログイン済みセッションを使う
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .gte("recorded_at", start.toISOString())
    .lte("recorded_at", end.toISOString())
    .order("recorded_at", { ascending: true });

  if (error) {
    console.error("❌ 取得エラー:", error.message);
    console.log("\n💡 RLSが有効なため、サービスロールキーが必要かもしれません。");
    console.log("   .env.local に SUPABASE_SERVICE_ROLE_KEY を追加してください。");
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("📭 該当期間のエントリーがありません。");
    process.exit(0);
  }

  console.log(`✅ ${data.length}件のエントリーを取得しました。\n`);

  // 見やすい形式で表示
  for (const entry of data) {
    const date = new Date(entry.recorded_at);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${dayNames[date.getDay()]})`;
    console.log(`【${dateStr}】(id: ${entry.id})`);
    console.log(`  ${entry.transcript}`);
    console.log();
  }

  // JSONファイルに出力
  const outPath = resolve(__dirname, "entries.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`💾 ${outPath} に保存しました。`);

  // Claude Code用プロンプトも生成
  const promptEntries = data
    .map((e) => {
      const d = new Date(e.recorded_at);
      const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
      return `【${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})】(id: ${e.id})\n${e.transcript}`;
    })
    .join("\n\n");

  const prompt = `以下は1週間分の音声日記の文字起こしです。

--- entries ---
${promptEntries}

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
}`;

  const promptPath = resolve(__dirname, "prompt.txt");
  writeFileSync(promptPath, prompt, "utf-8");
  console.log(`📝 ${promptPath} にClaude用プロンプトを保存しました。`);
  console.log("\n🚀 次のステップ:");
  console.log("   1. prompt.txt の内容をClaude Codeに貼り付けて分析を依頼");
  console.log("   2. 返ってきたJSONを results.json として保存");
  console.log("   3. node scripts/write-back.js --input results.json を実行");
}

main();
