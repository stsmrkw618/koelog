"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, type Entry } from "@/lib/supabase";
import EntryCard from "./EntryCard";

const DAY_NAMES = ["月", "火", "水", "木", "金", "土", "日"];

const MOOD_COLORS: Record<string, string> = {
  positive: "#4ADE80",
  neutral: "#60A5FA",
  mixed: "#FBBF24",
  negative: "#F87171",
  unanalyzed: "#6B7280",
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  // Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  const fetchEntries = useCallback(async () => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const { data } = await supabase
      .from("entries")
      .select("*")
      .gte("recorded_at", start.toISOString())
      .lte("recorded_at", end.toISOString())
      .order("recorded_at", { ascending: true });

    setEntries((data as Entry[]) ?? []);
  }, [year, month]);

  useEffect(() => {
    fetchEntries();
    setSelectedDate(null);
  }, [fetchEntries]);

  const entriesByDay = entries.reduce<Record<number, Entry[]>>((acc, entry) => {
    const d = new Date(entry.recorded_at).getDate();
    if (!acc[d]) acc[d] = [];
    acc[d].push(entry);
    return acc;
  }, {});

  const cells = getMonthDays(year, month);

  const goMonth = (delta: number) => {
    setDirection(delta);
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setYear(newYear);
    setMonth(newMonth);
  };

  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  const selectedEntries = selectedDate ? entriesByDay[selectedDate] ?? [] : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goMonth(-1)}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center
                     text-[var(--text-muted)] active:scale-95 transition-transform"
        >
          ◀
        </button>
        <h2 className="text-base font-semibold font-[Outfit] tracking-wide">
          {year}年{month + 1}月
        </h2>
        <button
          onClick={() => goMonth(1)}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center
                     text-[var(--text-muted)] active:scale-95 transition-transform"
        >
          ▶
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] text-[var(--text-muted)] font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const dayEntries = entriesByDay[day];
            const mood = dayEntries?.[0]?.mood;
            const isSelected = selectedDate === day;
            const today = isToday(day);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center
                           gap-0.5 text-sm transition-all duration-200 relative
                           ${isSelected
                             ? "bg-[var(--primary)]/15 border border-[var(--primary)]/30"
                             : "active:scale-90"
                           }
                           ${today && !isSelected ? "border border-white/10" : ""}
                          `}
              >
                <span className={`font-[Outfit] text-xs ${
                  isSelected ? "text-[var(--primary)] font-semibold"
                  : today ? "text-[var(--text)] font-medium"
                  : "text-[var(--text)]/70"
                }`}>
                  {day}
                </span>
                {dayEntries && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: MOOD_COLORS[mood ?? "unanalyzed"] }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Entry count summary */}
      <div className="flex justify-center">
        <div className="glass rounded-full px-4 py-1.5 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span>{entries.length}件の記録</span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MOOD_COLORS.positive }} />
            {entries.filter(e => e.mood === "positive").length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MOOD_COLORS.neutral }} />
            {entries.filter(e => e.mood === "neutral").length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MOOD_COLORS.unanalyzed }} />
            {entries.filter(e => e.mood === "unanalyzed").length}
          </span>
        </div>
      </div>

      {/* Selected date entries */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {month + 1}月{selectedDate}日
                </span>
                {selectedEntries.length > 0 && (
                  <span className="text-[10px] glass rounded-full px-2 py-0.5 text-[var(--text-muted)]">
                    {selectedEntries.length}件
                  </span>
                )}
              </div>

              {selectedEntries.length > 0 ? (
                selectedEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))
              ) : (
                <div className="glass-strong rounded-2xl p-6 text-center">
                  <p className="text-[var(--text-muted)] text-sm">記録なし</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
