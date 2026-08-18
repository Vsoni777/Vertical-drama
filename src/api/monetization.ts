import api from "./api";

export interface Subscription {
  id: number;
  plan: string;
  status: string;
  active: boolean;
  started_at?: string;
  ends_at?: string;
  stripe_subscription_id?: string;
}

export interface MeResponse {
  data: {
    id: number;
    email: string;
    role: string;
    coin_balance: number;
    subscribed: boolean;
    subscription: {
      plan: string;
      ends_at: string;
    } | null;
  };
}

export interface SubscriptionResponse {
  data: Subscription | null;
}

export interface CheckoutResponse {
  data: {
    checkout_url: string;
    session_id: string;
    mode?: "stripe";
  };
}

export interface CoinTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export interface CoinBalanceResponse {
  data: {
    coin_balance: number;
    transactions: CoinTransaction[];
  };
}

export interface CoinPurchaseResponse {
  data: {
    checkout_url: string;
    session_id: string;
    mode: "stripe";
  };
}

export interface RewardResponse {
  data: {
    transaction_id?: number;
    coins_earned: number;
    coin_balance: number;
  };
}

export interface RewardStatusResponse {
  data: {
    daily_login_claimed: boolean;
  };
}

export const getMe = () =>
  api.get<MeResponse>("/api/v1/me");

export const getSubscription = () =>
  api.get<SubscriptionResponse>("/api/v1/subscriptions");

export const createSubscription = ( plan: "monthly" | "yearly") =>
  api.post<{
    data: {
      checkout_url: string;
      session_id: string;
      mode: "stripe";
    };
  }>("/api/v1/subscriptions/checkout", { plan });

export const cancelSubscription = () =>
  api.delete("/api/v1/subscriptions");

export const getCoinBalance = () =>
  api.get<CoinBalanceResponse>("/api/v1/coins");

export const purchaseCoins = ( pack: "small" | "medium" | "large" ) =>
  api.post<{
    data: {
      checkout_url: string;
      session_id: string;
      mode: "stripe";
    };
  }>("/api/v1/coins/purchase", { pack });

export const claimReward = (
  reward_type: "daily_login" | "watch_ad" | "referral"
) =>
  api.post<RewardResponse>(
    "/api/v1/coins/reward",
    { reward_type }
  );

export const rewardStatus = async () => {
  const response =
    await api.get<RewardStatusResponse>(
      "/api/v1/coins/reward_status"
    );

  return response.data.data;
};

export const getContinueWatching = () =>
  api.get("/api/v1/watch_progress");


export const saveWatchProgress = (
  episode_id: number,
  progress_seconds: number,
  completed = false
) =>
  api.patch(
    "/api/v1/watch_progress",
    {
      episode_id,
      progress_seconds,
      completed
    }
  );