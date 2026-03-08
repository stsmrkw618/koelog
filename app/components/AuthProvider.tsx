"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Auth from "./Auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center min-h-[85vh] gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[#E8941A]
                          flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]">
            <span className="text-2xl">🎙️</span>
          </div>
          <div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)]
                          rounded-full animate-spin" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Auth user={user}>{children}</Auth>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
