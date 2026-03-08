"use client";

import { motion } from "framer-motion";

const MOOD_EMOJI: Record<string, string> = {
  positive: "😊",
  neutral: "😐",
  mixed: "🤔",
  negative: "😔",
};

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

type Props = {
  moodSequence: { day: string; mood: string }[];
};

export default function MoodBar({ moodSequence }: Props) {
  return (
    <div className="flex justify-between items-end gap-1 px-2">
      {DAY_LABELS.map((label, i) => {
        const item = moodSequence[i];
        const emoji = item ? MOOD_EMOJI[item.mood] ?? "·" : "·";
        const hasEntry = !!item;

        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className={`text-xl ${hasEntry ? "" : "opacity-20"}`}>
              {emoji}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-[Outfit]">
              {label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
