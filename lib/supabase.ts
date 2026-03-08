import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Entry = {
  id: string;
  user_id: string;
  recorded_at: string;
  audio_url: string | null;
  duration_seconds: number | null;
  transcript: string;
  mood: "unanalyzed" | "positive" | "neutral" | "mixed" | "negative";
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type WeeklySummary = {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  highlight: string | null;
  mood_sequence: { day: string; mood: string }[] | null;
  topic_distribution: Record<string, number> | null;
  insight: string | null;
  entry_count: number | null;
  created_at: string;
};
