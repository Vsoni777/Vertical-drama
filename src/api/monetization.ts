import api from "./api";

export const getMe = () =>
  api.get<{
    data: {
      id: number;
      email: string;
      role: string;
      coin_balance: number;
      subscribed: boolean;
      subscription: { plan: string; ends_at: string } | null;
    };
  }>("/api/v1/me");

export const getSubscription = () => api.get("/api/v1/subscriptions");

export const createSubscription = (plan: string) =>
  api.post<{
    data: {
      checkout_url?: string;
      mode?: "stripe" | "dev";
      subscription?: { plan: string; status: string; active: boolean; ends_at?: string };
    };
  }>("/api/v1/subscriptions/checkout", { plan });

export const cancelSubscription = () => api.delete("/api/v1/subscriptions");

export const verifySubscription = (session_id: string) =>
  api.post<{ data: { plan: string; status: string; active: boolean; ends_at?: string } }>(
    "/api/v1/subscriptions/verify_subscription",
    { session_id }
  );

export const getCoinBalance = () => api.get("/api/v1/coins");

export const purchaseCoins = (pack: "small" | "medium" | "large") =>
  api.post<{
    data: {
      checkout_url?: string;
      session_id?:   string;
      coins_added?:  number;
      coin_balance?: number;
      mode: "stripe" | "dev";
    };
  }>("/api/v1/coins/purchase", { pack });

export const verifyPurchase = (session_id: string) =>
  api.post<{ data: { coins_added: number; coin_balance: number } }>(
    "/api/v1/coins/purchase/verify",
    { session_id }
  );
export const claimReward = (
  reward_type: "daily_login" | "watch_ad" | "referral"
) => api.post("/api/v1/coins/reward", { reward_type });

export const getContinueWatching = () => api.get("/api/v1/watch_progress");

export const saveWatchProgress = (
  episode_id: number,
  progress_seconds: number,
  completed = false
) => api.patch("/api/v1/watch_progress", { episode_id, progress_seconds, completed });

export const rewardStatus = async () => {
  const response = await api.get("/api/v1/coins/reward_status");

  return response.data.data;
};