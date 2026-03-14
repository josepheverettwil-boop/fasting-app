import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/lib/storage";

const NICKNAME_KEY = "fasting_app_nickname";

interface NicknameContextType {
  nickname: string | null;
  loading: boolean;
  setNickname: (name: string) => Promise<void>;
  clearNickname: () => Promise<void>;
}

const NicknameContext = createContext<NicknameContextType | undefined>(undefined);

export function NicknameProvider({ children }: { children: React.ReactNode }) {
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.get(NICKNAME_KEY).then((val) => {
      setNicknameState(val);
      setLoading(false);
    });
  }, []);

  const setNickname = async (name: string) => {
    await storage.set(NICKNAME_KEY, name);
    setNicknameState(name);
  };

  const clearNickname = async () => {
    await storage.remove(NICKNAME_KEY);
    setNicknameState(null);
  };

  return (
    <NicknameContext.Provider value={{ nickname, loading, setNickname, clearNickname }}>
      {children}
    </NicknameContext.Provider>
  );
}

export function useNickname() {
  const ctx = useContext(NicknameContext);
  if (!ctx) throw new Error("useNickname must be used within NicknameProvider");
  return ctx;
}
