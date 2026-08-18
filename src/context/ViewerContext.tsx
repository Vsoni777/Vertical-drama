import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMe } from "../api/monetization";
import { useAuth } from "../hooks/useAuth";

type ViewerState = {
  coins: number;
  subscribed: boolean;
  subscriptionPlan: string | null;
  subscriptionEndsAt: string | null;
  savedIds: number[];
  unlockedIds: number[];
  progress: Record<string, number>;
  isAdmin: boolean;
  loading: boolean;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => void;
  subscribe: () => void;
  unsubscribe: () => void;
  toggleSaved: (id: number) => void;
  markUnlocked: (episodeId: number) => void;
  recordProgress: (seriesId: number, episodeId: number, progress: number) => void;
  refresh: () => void;
};

const defaults: ViewerState = {
  coins: 0, subscribed: false, subscriptionPlan: null, subscriptionEndsAt: null, savedIds: [], unlockedIds: [], progress: {}, isAdmin: false, loading: true,
  addCoins: () => undefined, deductCoins: () => undefined, subscribe: () => undefined,
  unsubscribe: () => undefined, toggleSaved: () => undefined, markUnlocked: () => undefined,
  recordProgress: () => undefined, refresh: () => undefined,
};

export const ViewerContext = createContext<ViewerState>(defaults);

export function ViewerProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [coins, setCoins]           = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [loading, setLoading]       = useState(Boolean(token));

  const [savedIds, setSavedIds]     = useState<number[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("vivid-saved") || "[]") as number[]; } catch { return []; }
  });
  const [unlockedIds, setUnlockedIds] = useState<number[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("vivid-unlocked") || "[]") as number[]; } catch { return []; }
  });
  const [progress, setProgress]     = useState<Record<string, number>>(() => {
    try { return JSON.parse(sessionStorage.getItem("vivid-progress") || "{}") as Record<string, number>; } catch { return {}; }
  });

  const fetchMe = useCallback(async () => {
    if (!token) {
      setCoins(0);
      setSubscribed(false);
      setSubscriptionPlan(null);
      setSubscriptionEndsAt(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await getMe();
      const { coin_balance, subscribed: sub, role, subscription } = res.data.data;
      setCoins(coin_balance ?? 0);
      setSubscribed(Boolean(sub));
      setSubscriptionPlan(subscription?.plan ?? null);
      setSubscriptionEndsAt(subscription?.ends_at ?? null);
      setIsAdmin(role === "admin");
    } catch {
      setCoins(0);
      setSubscribed(false);
      setSubscriptionPlan(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchMe(); }, [fetchMe]);

  useEffect(() => sessionStorage.setItem("vivid-saved",    JSON.stringify(savedIds)),    [savedIds]);
  useEffect(() => sessionStorage.setItem("vivid-unlocked", JSON.stringify(unlockedIds)), [unlockedIds]);
  useEffect(() => sessionStorage.setItem("vivid-progress", JSON.stringify(progress)),    [progress]);

  const value = useMemo<ViewerState>(() => ({
    coins, subscribed, subscriptionPlan, subscriptionEndsAt, savedIds, unlockedIds, progress, isAdmin, loading,
    addCoins:    (n) => setCoins((c) => c + n),
    deductCoins: (n) => setCoins((c) => Math.max(0, c - n)),
    subscribe:   ()  => setSubscribed(true),
    unsubscribe: ()  => { setSubscribed(false); setSubscriptionPlan(null); setSubscriptionEndsAt(null); },
    toggleSaved: (id) => setSavedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    ),
    markUnlocked: (episodeId) =>
      setUnlockedIds((ids) => [...new Set([...ids, episodeId])]),
    recordProgress: (seriesId, episodeId, prog) =>
      setProgress((p) => ({ ...p, [`${seriesId}-${episodeId}`]: prog })),
    refresh: () => { void fetchMe(); },
  }), [coins, subscribed, subscriptionPlan, subscriptionEndsAt, savedIds, unlockedIds, progress, isAdmin, loading, fetchMe]);

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}
