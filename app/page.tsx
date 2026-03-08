"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Recorder from "./components/Recorder";
import { supabase, type Entry } from "@/lib/supabase";

export default function Home() {
  const [yesterday, setYesterday] = useState<Entry | null>(null);

  useEffect(() => {
    async function fetchYesterday() {
      const now = new Date();
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(now.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("entries")
        .select("*")
        .gte("recorded_at", yesterdayStart.toISOString())
        .lte("recorded_at", yesterdayEnd.toISOString())
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setYesterday(data[0] as Entry);
      }
    }

    fetchYesterday();
  }, []);

  const today = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}(${dayNames[today.getDay()]})`;

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Background ambient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96
                      rounded-full bg-[var(--primary)] opacity-[0.02] blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[#E8941A]
                          flex items-center justify-center shadow-sm shadow-[var(--primary-glow)]">
            <span className="text-sm">🎙️</span>
          </div>
          <h1 className="text-lg font-bold font-[Outfit] text-gradient">KoeLog</h1>
        </div>
        <span className="text-[var(--text-muted)] text-sm font-[Outfit] tracking-wide">
          {dateStr}
        </span>
      </motion.div>

      {/* Recorder */}
      <div className="mt-2">
        <Recorder />
      </div>

      {/* Yesterday's entry */}
      {yesterday && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-strong rounded-2xl p-5"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs">💬</span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase">
              Yesterday
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text)]/80 line-clamp-3">
            「{yesterday.transcript}」
          </p>
        </motion.div>
      )}
    </div>
  );
}
