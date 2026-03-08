"use client";

import { motion } from "framer-motion";

const BAR_COLORS = [
  "from-[var(--primary)] to-[#E8941A]",
  "from-[var(--positive)] to-[#34D399]",
  "from-[var(--neutral)] to-[#818CF8]",
  "from-[var(--mixed)] to-[#F59E0B]",
  "from-[var(--negative)] to-[#FB923C]",
];

type Props = {
  distribution: Record<string, number>;
};

export default function TopicChart({ distribution }: Props) {
  const sorted = Object.entries(distribution).sort(([, a], [, b]) => b - a);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(([topic, pct], i) => (
        <div key={topic} className="flex items-center gap-3">
          <span className="text-xs text-[var(--text)]/80 w-16 text-right shrink-0">
            {topic}
          </span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]}`}
            />
          </div>
          <span className="text-xs text-[var(--text-muted)] font-[Outfit] w-10 shrink-0">
            {pct}%
          </span>
        </div>
      ))}
    </div>
  );
}
