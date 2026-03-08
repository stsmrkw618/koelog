"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startRecording, type RecorderResult } from "@/lib/recorder";
import { createSpeechRecognition, isSpeechSupported } from "@/lib/speech";
import { supabase } from "@/lib/supabase";
import WaveVisualizer from "./WaveVisualizer";

const MAX_DURATION = 180;

type RecordingState = "idle" | "recording" | "preview";

export default function Recorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [result, setResult] = useState<RecorderResult | null>(null);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const stopRecorderRef = useRef<(() => Promise<RecorderResult>) | null>(null);
  const speechRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechSupported());
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = useCallback(async () => {
    try {
      const rec = await startRecording();
      stopRecorderRef.current = rec.stop;
      setAnalyser(rec.analyser);
      setState("recording");
      setTranscript("");
      setInterimText("");
      setElapsed(0);
      setSaved(false);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_DURATION - 1) {
            handleStop();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      if (isSpeechSupported()) {
        const speech = createSpeechRecognition({
          onInterim: (text) => setInterimText(text),
          onFinal: (text) => {
            setTranscript(text);
            setInterimText("");
          },
          onError: (err) => console.warn("Speech error:", err),
          onEnd: () => {},
        });
        speechRef.current = speech;
        speech.start();
      }
    } catch {
      alert("マイクへのアクセスが拒否されました。設定から許可してください。");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    speechRef.current?.stop();

    const recResult = await stopRecorderRef.current?.();
    if (recResult) setResult(recResult);

    const finalText = speechRef.current?.getFinalTranscript() || transcript;
    setTranscript(finalText);
    setEditedTranscript(finalText);
    setAnalyser(null);
    setState("preview");
  }, [transcript]);

  const handleSave = useCallback(async () => {
    if (!editedTranscript.trim()) {
      alert("テキストが空です。");
      return;
    }

    setSaving(true);
    try {
      let audioUrl: string | null = null;

      if (result?.blob) {
        const ext = result.blob.type.includes("webm") ? "webm" : "mp4";
        const fileName = `entries/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("audio")
          .upload(fileName, result.blob, { contentType: result.blob.type });

        if (!uploadError) {
          const { data } = supabase.storage.from("audio").getPublicUrl(fileName);
          audioUrl = data.publicUrl;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      const { error } = await supabase.from("entries").insert({
        user_id: user.id,
        transcript: editedTranscript,
        audio_url: audioUrl,
        duration_seconds: result?.duration ?? elapsed,
        recorded_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => {
        setState("idle");
        setTranscript("");
        setInterimText("");
        setEditedTranscript("");
        setResult(null);
        setElapsed(0);
        setSaved(false);
      }, 1500);
    } catch (err) {
      console.error("Save failed:", err);
      alert("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }, [editedTranscript, result, elapsed]);

  const handleDiscard = () => {
    setState("idle");
    setTranscript("");
    setInterimText("");
    setEditedTranscript("");
    setResult(null);
    setElapsed(0);
  };

  return (
    <div className="flex flex-col items-center gap-6 relative">
      {/* Background glow when recording */}
      <AnimatePresence>
        {state === "recording" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80
                       rounded-full bg-[var(--primary)] opacity-[0.04] blur-[100px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* === IDLE STATE === */}
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-5 pt-8"
          >
            <button
              onClick={handleStart}
              className="relative w-44 h-44 rounded-full
                         bg-gradient-to-b from-[var(--card)] to-[var(--surface)]
                         border border-[var(--primary)]/30
                         flex flex-col items-center justify-center gap-2
                         animate-pulse-glow active:scale-95 transition-transform"
            >
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-[var(--primary)]/10" />
              <div className="absolute -inset-2 rounded-full border border-[var(--primary)]/5" />

              <span className="text-5xl drop-shadow-lg">🎙️</span>
              <span className="text-[var(--primary)] font-[Outfit] font-semibold text-xl tracking-wider">
                0:00
              </span>
            </button>
            <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase">
              tap to start
            </p>
          </motion.div>
        )}

        {/* === RECORDING STATE === */}
        {state === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-5 w-full pt-4"
          >
            <button
              onClick={handleStop}
              className="relative w-44 h-44 rounded-full
                         bg-gradient-to-b from-[var(--card)] to-[var(--surface)]
                         border border-[var(--primary)]/40
                         flex flex-col items-center justify-center gap-1
                         animate-recording-pulse active:scale-95 transition-transform"
            >
              <div className="absolute -inset-2 rounded-full border border-[var(--primary)]/10 animate-ping opacity-20" />

              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--negative)] animate-pulse" />
                <span className="text-[var(--negative)] text-xs font-medium tracking-wide">
                  REC
                </span>
              </div>

              <div className="w-[120px]">
                <WaveVisualizer analyser={analyser} isRecording={true} />
              </div>

              <span className="text-[var(--primary)] font-[Outfit] font-semibold text-2xl tracking-wider">
                {formatTime(elapsed)}
              </span>
            </button>

            <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase">
              tap to stop
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-[200px] h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[#E8941A] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(elapsed / MAX_DURATION) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Real-time transcript */}
            {(interimText || transcript) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full glass-strong rounded-2xl p-4 mt-2"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">📝</span>
                  <span className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase">
                    Live Transcript
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {interimText || transcript}
                </p>
              </motion.div>
            )}

            {!speechSupported && (
              <p className="text-xs text-[var(--text-muted)] glass rounded-xl px-3 py-2">
                このブラウザは音声認識に非対応です。録音後に手動入力できます。
              </p>
            )}
          </motion.div>
        )}

        {/* === PREVIEW STATE === */}
        {state === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5 w-full pt-4"
          >
            {/* Duration badge */}
            <div className="flex justify-center">
              <div className="glass-strong rounded-full px-5 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--positive)]" />
                <span className="text-[var(--primary)] font-[Outfit] font-semibold text-lg">
                  {formatTime(result?.duration ?? elapsed)}
                </span>
                <span className="text-[var(--text-muted)] text-xs">録音完了</span>
              </div>
            </div>

            {/* Transcript editor */}
            <div className="glass-strong rounded-2xl p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs">📝</span>
                <span className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase">
                  Transcript
                </span>
                <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                  編集可能
                </span>
              </div>
              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                rows={5}
                placeholder="ここにテキストを入力..."
                className="w-full bg-transparent text-sm leading-relaxed resize-none
                           focus:outline-none placeholder:text-[var(--text-muted)]/40"
              />
            </div>

            {/* Action buttons */}
            {saved ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 py-3"
              >
                <span className="text-[var(--positive)] text-lg">✓</span>
                <span className="text-[var(--positive)] text-sm font-medium">保存しました</span>
              </motion.div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleDiscard}
                  className="flex-1 py-3.5 rounded-xl glass text-[var(--text-muted)]
                             text-sm font-medium active:scale-[0.97] transition-transform"
                >
                  破棄
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold
                             bg-gradient-to-r from-[var(--primary)] to-[#E8941A]
                             text-[var(--bg)] active:scale-[0.97] transition-transform
                             shadow-lg shadow-[var(--primary-glow)]
                             disabled:opacity-50 disabled:shadow-none"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[var(--bg)]/30 border-t-[var(--bg)] rounded-full animate-spin" />
                      保存中
                    </span>
                  ) : (
                    "保存する"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
