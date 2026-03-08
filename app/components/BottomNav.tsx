"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  { href: "/", label: "録音", icon: "🎙️" },
  { href: "/calendar", label: "履歴", icon: "📅" },
  { href: "/highlights", label: "週報", icon: "✨" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]
                 glass border-t-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-center h-16 px-4">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center gap-0.5 py-1 px-5"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-0.5 rounded-full
                             bg-gradient-to-r from-[var(--primary)] to-[#E8941A]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`text-xl transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] transition-colors ${
                active ? "text-[var(--primary)] font-medium" : "text-[var(--text-muted)]"
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
