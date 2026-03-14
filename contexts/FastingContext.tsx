import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/lib/storage";
import { Fast, MoodEntry } from "@/lib/types";

const FASTS_KEY = "fasting_app_fasts";
const MOODS_KEY = "fasting_app_moods";

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function FastingProvider({ children }: { children: React.ReactNode }) {
  const [allFasts, setAllFasts] = useState<Fast[]>([]);
  const [allMoods, setAllMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const activeFast = allFasts.find((f) => f.is_active) ?? null;
  const pastFasts = allFasts
    .filter((f) => !f.is_active)
    .sort((a, b) => new Date(b.ended_at ?? 0).getTime() - new Date(a.ended_at ?? 0).getTime());
  const moodEntries = activeFast
    ? allMoods.filter((m) => m.fast_id === activeFast.id).sort((a, b) => a.hours_into_fast - b.hours_into_fast)
    : [];

  const persist = useCallback(async (fasts: Fast[], moods: MoodEntry[]) => {
    await Promise.all([
      storage.set(FASTS_KEY, JSON.stringify(fasts)),
      storage.set(MOODS_KEY, JSON.stringify(moods)),
    ]);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [fastsJson, moodsJson] = await Promise.all([
        storage.get(FASTS_KEY),
        storage.get(MOODS_KEY),
      ]);
      setAllFasts(fastsJson ? JSON.parse(fastsJson) : []);
      setAllMoods(moodsJson ? JSON.parse(moodsJson) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startFast = async (targetHours: number) => {
    const newFast: Fast = {
      id: generateId(),
      user_id: "local",
      started_at: new Date().toISOString(),
      target_hours: targetHours,
      ended_at: null,
      is_active: true,
      notes: null,
      created_at: new Date().toISOString(),
    };
    const updated = [...allFasts, newFast];
    setAllFasts(updated);
    await persist(updated, allMoods);
  };

  const endFast = async (notes?: string) => {
    if (!activeFast) return;
    const updated = allFasts.map((f) =>
      f.id === activeFast.id
        ? { ...f, ended_at: new Date().toISOString(), is_active: false, notes: notes ?? null }
        : f
    );
    setAllFasts(updated);
    await persist(updated, allMoods);
  };

  const logMood = async (score: 1 | 2 | 3 | 4 | 5, note?: string) => {
    if (!activeFast) return;
    const hoursIntoFast = getElapsedHours();
    const entry: MoodEntry = {
      id: generateId(),
      fast_id: activeFast.id,
      user_id: "local",
      mood_score: score,
      note: note ?? null,
      hours_into_fast: Math.round(hoursIntoFast * 100) / 100,
      created_at: new Date().toISOString(),
    };
    const updated = [...allMoods, entry];
    setAllMoods(updated);
    await persist(allFasts, updated);
  };

  const getElapsedHours = () => {
    if (!activeFast) return 0;
    const start = new Date(activeFast.started_at).getTime();
    return (Date.now() - start) / (1000 * 60 * 60);
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
        refreshFasts: loadData,
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
