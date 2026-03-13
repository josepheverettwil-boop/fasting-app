import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Fast, MoodEntry } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface FastingContextType {
  activeFast: Fast | null;
  pastFasts: Fast[];
  moodEntries: MoodEntry[];
  loading: boolean;
  startFast: (targetHours: number) => Promise<void>;
  endFast: (notes?: string) => Promise<void>;
  logMood: (score: 1 | 2 | 3 | 4 | 5, note?: string) => Promise<void>;
  refreshFasts: () => Promise<void>;
  getElapsedHours: () => number;
}

const FastingContext = createContext<FastingContextType | undefined>(undefined);

export function FastingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeFast, setActiveFast] = useState<Fast | null>(null);
  const [pastFasts, setPastFasts] = useState<Fast[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFasts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: active } = await supabase
      .from("fasts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveFast(active);

    const { data: past } = await supabase
      .from("fasts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", false)
      .order("ended_at", { ascending: false })
      .limit(20);

    setPastFasts(past ?? []);

    if (active) {
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("fast_id", active.id)
        .order("hours_into_fast", { ascending: true });
      setMoodEntries(moods ?? []);
    } else {
      setMoodEntries([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFasts();
  }, [fetchFasts]);

  const startFast = async (targetHours: number) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("fasts")
      .insert({
        user_id: user.id,
        target_hours: targetHours,
        started_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    setActiveFast(data);
    setMoodEntries([]);
  };

  const endFast = async (notes?: string) => {
    if (!activeFast) return;
    const { error } = await supabase
      .from("fasts")
      .update({
        ended_at: new Date().toISOString(),
        is_active: false,
        notes,
      })
      .eq("id", activeFast.id);

    if (error) throw error;

    setPastFasts((prev) => [{ ...activeFast, ended_at: new Date().toISOString(), is_active: false, notes: notes ?? null }, ...prev]);
    setActiveFast(null);
  };

  const logMood = async (score: 1 | 2 | 3 | 4 | 5, note?: string) => {
    if (!activeFast || !user) return;
    const hoursIntoFast = getElapsedHours();

    const { data, error } = await supabase
      .from("mood_entries")
      .insert({
        fast_id: activeFast.id,
        user_id: user.id,
        mood_score: score,
        note: note || null,
        hours_into_fast: Math.round(hoursIntoFast * 100) / 100,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) setMoodEntries((prev) => [...prev, data]);
  };

  const getElapsedHours = () => {
    if (!activeFast) return 0;
    const start = new Date(activeFast.started_at).getTime();
    const now = Date.now();
    return (now - start) / (1000 * 60 * 60);
  };

  return (
    <FastingContext.Provider
      value={{
        activeFast,
        pastFasts,
        moodEntries,
        loading,
        startFast,
        endFast,
        logMood,
        refreshFasts: fetchFasts,
        getElapsedHours,
      }}
    >
      {children}
    </FastingContext.Provider>
  );
}

export function useFasting() {
  const ctx = useContext(FastingContext);
  if (!ctx) throw new Error("useFasting must be used within FastingProvider");
  return ctx;
}
