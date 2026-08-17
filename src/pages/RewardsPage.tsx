import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useViewer } from "../hooks/useViewer";
import { claimReward, rewardStatus } from "../api/monetization";

type RewardType = "daily_login" | "watch_ad" | "referral";

const REWARDS: Array<{
  type: RewardType;
  title: string;
  copy: string;
  amount: number;
  icon: string;
}> = [
  {
    type: "daily_login",
    title: "Daily check-in",
    copy: "Return each day to keep your streak alive.",
    amount: 5,
    icon: "📅",
  },
];

export default function RewardsPage() {
  const viewer = useViewer();

  const [loading, setLoading] = useState<RewardType | null>(null);
  const [claimed, setClaimed] = useState<RewardType[]>([]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await rewardStatus();

        const claimedRewards: RewardType[] = [];

        if (response.daily_login_claimed) {
          claimedRewards.push("daily_login");
        }

        setClaimed(claimedRewards);
      } catch (error) {
        console.error("Failed to load reward status", error);
      }
    };

    loadStatus();
  }, []);

  const claim = async (type: RewardType, amount: number) => {
    if (claimed.includes(type)) return;

    setLoading(type);

    try {
      await claimReward(type);

      viewer.addCoins(amount);
      await viewer.refresh();

      setClaimed((prev) => [...prev, type]);

      toast.success(`+${amount} coins claimed!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;

      toast.error(msg || "Could not claim reward");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="content-page rewards-page">
      <p className="eyebrow">REWARDS CENTRE</p>
      <h1>Earn your next episode</h1>
      <p className="subcopy">
        Complete simple actions to collect coins and unlock more of your
        favourite series.
      </p>

      <div className="reward-balance-bar">
        <span>Your balance</span>
        <strong>◉ {viewer.coins} coins</strong>
      </div>

      <div className="reward-list">
        {REWARDS.map((reward) => {
          const isClaimed = claimed.includes(reward.type);
          const isLoading = loading === reward.type;

          return (
            <article
              className="reward-card"
              key={reward.type}
              id={`reward-${reward.type}`}
            >
              <span className="reward-icon">{reward.icon}</span>

              <div>
                <h2>{reward.title}</h2>
                <p>{reward.copy}</p>
              </div>

              <button
                className={isClaimed ? "claimed" : "primary-action"}
                onClick={() => claim(reward.type, reward.amount)}
                disabled={isClaimed || !!loading}
              >
                {isLoading
                  ? "..."
                  : isClaimed
                  ? "Claimed ✓"
                  : `Claim ◉ ${reward.amount}`}
              </button>
            </article>
          );
        })}
      </div>
    </main>
  );
}