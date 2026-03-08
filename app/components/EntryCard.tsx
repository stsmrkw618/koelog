"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import type { Entry } from "@/lib/supabase";

const MOOD_LABEL: Record<string, { emoji: string; label: string; color: string }> = {
  positive: { emoji: "😊", label: "ポジティブ", color: "#4ADE80" },
  neutral: { emoji: "😐", label: "ニュートラル", color: "#60A5FA" },
  mixed: { emoji: "🤔", label: "混合", color: "#FBBF24" },
  negative: { emoji: "😔", label: "ネガティブ", color: "#F87171" },
  unanalyzed: { emoji: "⏳", label: "分析待ち", color: "#6B7280" },
};

export default function EntryCard({ entry }: { entry: Entry }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mood = MOOD_LABEL[entry.mood] ?? MOOD_LABEL.unanalyzed;
  const time = new Date(entry.recorded_at).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const formatDuration = (s: number | null) => {
    if (!s) return "";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 flex flex-col gap-3"
    >
      {/* Header: time + mood */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--primary)] font-[Outfit] text-xs font-medium">
            🎙️ {time}
          </span>
          {entry.duration_seconds && (
            <span className="text-[10px] text-[var(--text-muted)] font-[Outfit]">
              {formatDuration(entry.duration_seconds)}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2.5 py-1"
          style={{ backgroundColor: `${mood.color}15` }}
        >
          <span className="text-xs">{mood.emoji}</span>
          <span className="text-[10px] font-medium" style={{ color: mood.color }}>
            {mood.label}
          </span>
        </div>
      </div>

      {/* Transcript */}
      <p className="text-sm leading-relaxed text-[var(--text)]/85">
        「{entry.transcript}」
      </p>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="glass rounded-full px-2.5 py-0.5 text-[10px] text-[var(--primary)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Audio player */}
      {entry.audio_url && (
        <button
          onClick={togglePlay}
          className="flex items-center gap-2 glass rounded-xl px-4 py-2.5
                     active:scale-[0.97] transition-transform self-start"
        >
          <span className={`text-sm ${playing ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
            {playing ? "⏸" : "▶"}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {playing ? "再生中..." : "音声を再生"}
          </span>
          <audio
            ref={audioRef}
            src={entry.audio_url}
            onEnded={() => setPlaying(false)}
            preload="none"
          />
        </button>
      )}
    </motion.div>
  );
}
