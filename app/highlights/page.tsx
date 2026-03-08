"use client";

import { motion } from "framer-motion";
import WeeklySummaryView from "../components/WeeklySummary";

export default function HighlightsPage() {
  return (
    <div className="flex flex-col gap-4 relative">
      {/* Background ambient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96
                      rounded-full bg-[var(--mixed)] opacity-[0.02] blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2.5"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--mixed)] to-[#F59E0B]
                        flex items-center justify-center shadow-sm">
          <span className="text-sm">✨</span>
        </div>
        <h1 className="text-lg font-bold font-[Outfit]">週報</h1>
      </motion.div>

      {/* Weekly summary content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <WeeklySummaryView />
      </motion.div>
    </div>
  );
}
