/**
 * write-back.js
 * Claude Codeの分析結果をSupabaseに書き戻す
 *
 * Usage:
 *   node scripts/write-back.js --input results.json
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- 環境変数の読み込み (.env.local) ---
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const [key, ...vals] = line.split("=");
  if (key && vals.length) env[key.trim()] = vals.join("=").trim();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- メイン処理 ---
async function main() {
  // 引数パース
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const inputFile = inputIdx !== -1 ? args[inputIdx + 1] : "results.json";
  const inputPath = resolve(__dirname, inputFile);

  console.log(`📄 結果ファイル読み込み: ${inputPath}`);

  let results;
  try {
    const raw = readFileSync(inputPath, "utf-8");
    results = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ ファイル読み込みエラー: ${e.message}`);
    process.exit(1);
  }

  // --- 1. 各エントリーのmood/tagsを更新 ---
  if (results.entries && results.entries.length > 0) {
    console.log(`\n🔄 ${results.entries.length}件のエントリーを更新中...`);

    for (const entry of results.entries) {
      const { error } = await supabase
        .from("entries")
        .update({
          mood: entry.mood,
          tags: entry.tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (error) {
        console.error(`  ❌ ${entry.id}: ${error.message}`);
      } else {
        console.log(`  ✅ ${entry.id}: mood=${entry.mood}, tags=[${entry.tags.join(", ")}]`);
      }
    }
  }

  // --- 2. 週次サマリーを作成 ---
  if (results.weekly_summary) {
    console.log("\n📊 週次サマリーを作成中...");

    // entries.json からuser_idとweek_rangeを取得
    let userId, weekStart, weekEnd;
    try {
      const entriesRaw = readFileSync(resolve(__dirname, "entries.json"), "utf-8");
      const entries = JSON.parse(entriesRaw);
      if (entries.length > 0) {
        userId = entries[0].user_id;

        // 週の開始日（月曜日）と終了日（日曜日）を計算
        const dates = entries.map((e) => new Date(e.recorded_at));
        const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
        const day = earliest.getDay();
        const diffToMon = day === 0 ? -6 : 1 - day;
        const monday = new Date(earliest);
        monday.setDate(earliest.getDate() + diffToMon);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        weekStart = monday.toISOString().slice(0, 10);
        weekEnd = sunday.toISOString().slice(0, 10);
      }
    } catch {
      console.error("  ⚠️ entries.json が見つかりません。user_idとweek_rangeを手動で指定してください。");
      process.exit(1);
    }

    const summary = {
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      highlight: results.weekly_summary.highlight,
      mood_sequence: results.weekly_summary.mood_sequence,
      topic_distribution: results.weekly_summary.topic_distribution,
      insight: results.weekly_summary.insight,
      entry_count: results.entries?.length ?? 0,
    };

    // UPSERT（同じ週の場合は上書き）
    const { error } = await supabase
      .from("weekly_summaries")
      .upsert(summary, { onConflict: "user_id,week_start" });

    if (error) {
      console.error(`  ❌ サマリー作成エラー: ${error.message}`);
    } else {
      console.log(`  ✅ Week ${weekStart} ~ ${weekEnd} のサマリーを保存しました。`);
    }
  }

  console.log("\n🎉 完了！アプリの「週報」タブで確認できます。");
}

main();
