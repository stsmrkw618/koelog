"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Props = {
  children: React.ReactNode;
  user: unknown;
};

export default function Auth({ children, user }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  if (user) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--primary)] opacity-[0.04] blur-[80px] ambient-orb" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-[var(--neutral)] opacity-[0.03] blur-[60px] ambient-orb-delayed" />

      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center mb-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[#E8941A]
                        flex items-center justify-center mb-4 shadow-lg shadow-[var(--primary-glow)]">
          <span className="text-3xl">🎙️</span>
        </div>
        <h1 className="text-3xl font-bold font-[Outfit] text-gradient">KoeLog</h1>
        <p className="text-[var(--text-muted)] text-sm mt-2 tracking-wide">
          30秒の声が、1週間の物語になる
        </p>
      </motion.div>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4 glass-strong rounded-3xl p-8 w-full max-w-xs"
        >
          <div className="w-14 h-14 rounded-full bg-[var(--primary-glow)] flex items-center justify-center">
            <span className="text-2xl">✉️</span>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">ログインリンクを送信しました</p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {email} に届いたメールの<br />リンクをクリックしてください
            </p>
          </div>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-xs text-[var(--primary)] mt-2 hover:underline"
          >
            別のメールアドレスで試す
          </button>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="w-full max-w-xs flex flex-col gap-4 glass-strong rounded-3xl p-6"
        >
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block ml-1">
              メールアドレス
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--bg)] text-sm
                         border border-white/5
                         focus:outline-none
                         placeholder:text-[var(--text-muted)]/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold
                       bg-gradient-to-r from-[var(--primary)] to-[#E8941A]
                       text-[var(--bg)] active:scale-[0.97] transition-transform
                       shadow-lg shadow-[var(--primary-glow)]
                       disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[var(--bg)]/30 border-t-[var(--bg)] rounded-full animate-spin" />
                送信中
              </span>
            ) : (
              "ログインリンクを送信"
            )}
          </button>

          {message && (
            <p className="text-xs text-center text-[var(--negative)]">{message}</p>
          )}

          <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
            パスワード不要 — メールのリンクをクリックするだけ
          </p>
        </motion.form>
      )}

      {/* Decorative bottom dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-2 mt-12"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] opacity-40 animate-float" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-40 animate-float-delayed" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--neutral)] opacity-40 animate-float-delayed-2" />
      </motion.div>
    </div>
  );
}
