"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, type WeeklySummary as WeeklySummaryType } from "@/lib/supabase";
import MoodBar from "./MoodBar";
import TopicChart from "./TopicChart";

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getWeekNumber(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

export default function WeeklySummaryView() {
  const [summaries, setSummaries] = useState<WeeklySummaryType[]>([]);
  const [entryCount, setEntryCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      // Fetch all weekly summaries
      const { data } = await supabase
        .from("weekly_summaries")
        .select("*")
        .order("week_start", { ascending: false });

      setSummaries((data as WeeklySummaryType[]) ?? []);

      // Count this week's entries
      const { start, end } = getWeekRange(new Date());
      const { count } = await supabase
        .from("entries")
        .select("*", { count: "exact", head: true })
        .gte("recorded_at", start.toISOString())
        .lte("recorded_at", end.toISOString());

      setEntryCount(count ?? 0);
      setLoading(false);
    }

    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="text-[var(--text-muted)] text-sm">読み込み中...</span>
      </div>
    );
  }

  const latest = summaries[0];
  const past = summaries.slice(1);
  const { start: thisWeekStart, end: thisWeekEnd } = getWeekRange(new Date());
  const isLatestThisWeek =
    latest &&
    new Date(latest.week_start).toDateString() === thisWeekStart.toDateString();

  return (
    <div className="flex flex-col gap-5">
      {/* This week's highlight or pending state */}
      {isLatestThisWeek && latest ? (
        <SummaryCard summary={latest} isLatest />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-6"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-glow)] flex items-center justify-center">
              <span className="text-xl">📝</span>
            </div>
            <div>
              <p className="text-sm font-medium">
                今週の記録: <span className="text-[var(--primary)] font-[Outfit] font-semibold">{entryCount}</span>件
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {formatDate(thisWeekStart)} - {formatDate(thisWeekEnd)}
              </p>
            </div>
            <div className="glass rounded-xl px-4 py-2 mt-1">
              <p className="text-xs text-[var(--text-muted)]">
                ハイライトは週末に生成されます
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Latest highlight (if not this week) */}
      {!isLatestThisWeek && latest && (
        <SummaryCard summary={latest} isLatest />
      )}

      {/* Past summaries */}
      {past.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-xs">📝</span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase">
              Past Highlights
            </span>
          </div>

          {past.map((s) => {
            const isExpanded = expandedId === s.id;
            const weekStart = new Date(s.week_start);
            const weekEnd = new Date(s.week_end);

            return (
              <div key={s.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full glass rounded-xl px-4 py-3 flex items-center justify-between
                             active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">▸</span>
                    <span className="text-sm">
                      Week {getWeekNumber(weekStart)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-[Outfit]">
                      {formatDate(weekStart)} - {formatDate(weekEnd)}
                    </span>
                  </div>
                  <span className="text-[10px] glass rounded-full px-2 py-0.5 text-[var(--text-muted)]">
                    {s.entry_count}件
                  </span>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        <SummaryCard summary={s} isLatest={false} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  summary,
  isLatest,
}: {
  summary: WeeklySummaryType;
  isLatest: boolean;
}) {
  const weekStart = new Date(summary.week_start);
  const weekEnd = new Date(summary.week_end);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Highlight */}
      {summary.highlight && (
        <div className={`rounded-2xl p-5 ${isLatest
          ? "bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/15"
          : "glass-strong"
        }`}>
          {isLatest && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🏆</span>
              <span className="text-xs font-medium text-[var(--primary)]">
                Week {getWeekNumber(weekStart)} Highlights
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-[Outfit] ml-auto">
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </span>
            </div>
          )}
          <p className="text-sm leading-relaxed">{summary.highlight}</p>
        </div>
      )}

      {/* Mood sequence */}
      {summary.mood_sequence && (
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-xs">📊</span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase">
              Weekly Mood
            </span>
          </div>
          <MoodBar moodSequence={summary.mood_sequence} />
        </div>
      )}

      {/* Topic distribution */}
      {summary.topic_distribution && (
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-xs">🏷️</span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase">
              Topics
            </span>
          </div>
          <TopicChart distribution={summary.topic_distribution} />
        </div>
      )}

      {/* Insight */}
      {summary.insight && (
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs">💡</span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase">
              Insight
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text)]/85">
            {summary.insight}
          </p>
        </div>
      )}
    </motion.div>
  );
}
