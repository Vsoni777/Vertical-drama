import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useViewer } from "../hooks/useViewer";
import {
  purchaseCoins,
  createSubscription,
  cancelSubscription,
  verifySubscription,
} from "../api/monetization";

export default function MembershipPage() {
  const viewer = useViewer();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (searchParams.get("canceled") === "true") {
      toast.error("Payment was canceled. You have not been charged.");
      setSearchParams(new URLSearchParams());
    } else if (searchParams.get("success") === "true") {
      if (sessionId) {
        verifySubscription(sessionId)
          .then(() => {
            viewer.refresh();
            toast.success("Payment successful! Your subscription is now active.");
          })
          .catch(() => {
            toast.error("Could not verify subscription. Please refresh or contact support.");
          })
          .finally(() => {
            setSearchParams(new URLSearchParams());
          });
      } else {
        toast.success("Payment successful! Your subscription is now active.");
        viewer.refresh();
        setSearchParams(new URLSearchParams());
      }
    }
  }, [searchParams, setSearchParams, viewer]);

  const handleSubscribe = async (plan: string) => {
    setLoading(`sub-${plan}`);
    try {
      const response = await createSubscription(plan);
      const { data } = response.data;

      if (data.mode === "stripe" && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        viewer.subscribe();
        viewer.refresh();
        toast.success(`${plan === "monthly" ? "Monthly" : "Yearly"} plan activated!`);
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.error ||
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.message ||
        "Could not activate subscription";

      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription?")) return;
    setLoading("cancel");
    try {
      await cancelSubscription();
      viewer.unsubscribe();
      viewer.refresh();
      toast.success("Subscription cancelled");
    } catch {
      toast.error("Could not cancel subscription");
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCoins = async (pack: "small" | "medium" | "large") => {
    setLoading(`coins-${pack}`);
    try {
      const response = await purchaseCoins(pack);
      const { data } = response.data;

      if (data.mode === "stripe" && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        viewer.addCoins(data.coins_added ?? 0);
        viewer.refresh();
        toast.success(`◉ ${data.coins_added ?? 0} coins added!`);
      }
    } catch {
      toast.error("Could not initiate purchase.");
    } finally {
      setLoading(null);
    }
  };

  const coinPacks: Array<{ pack: "small" | "medium" | "large"; coins: number; price: string; popular?: boolean }> = [
    { pack: "small",  coins: 50,  price: "$2.99" },
    { pack: "medium", coins: 120, price: "$5.99", popular: true },
    { pack: "large",  coins: 300, price: "$11.99" },
  ];

  const planName = viewer.subscriptionPlan === "yearly" ? "Yearly" : viewer.subscriptionPlan === "monthly" ? "Monthly" : "";
  const expiryDate = viewer.subscriptionEndsAt ? new Date(viewer.subscriptionEndsAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <main className="content-page commerce-page">
      <p className="eyebrow">YOUR VIEWING PASS</p>
      <h1>Watch your way</h1>
      <p className="subcopy">Choose unlimited premium access or unlock only the episodes you love.</p>
      <p style={{ marginBottom: 18, color: "#bdaec5", fontSize: 13 }}>
        Secure checkout is handled through Stripe. You will enter card details on the Stripe page before your access is activated.
      </p>

      <section className="plan-grid">
        <article className="plan-card featured">
          <span className="plan-badge">BEST VALUE</span>
          <h2>Vivid Plus</h2>
          <p>Unlimited premium stories, ad-free viewing and priority releases.</p>
          <strong>$7.99 <small>/ month</small></strong>
          {viewer.subscribed ? (
            <div>
              <p style={{ color: "#9cddb9", fontSize: 13, marginBottom: 4 }}>✓ {planName} Subscription active</p>
              {expiryDate && <p style={{ color: "#8a7e93", fontSize: 11, marginBottom: 14 }}>Renews / Expires on {expiryDate}</p>}
              <button
                className="primary-action"
                style={{ background: "#48253b", color: "#ffd0e6", width: "100%" }}
                onClick={handleCancel}
                disabled={loading === "cancel"}
                id="cancel-subscription-btn"
              >
                {loading === "cancel" ? "Cancelling…" : "Cancel plan"}
              </button>
            </div>
          ) : (
            <>
              <button
                className="primary-action"
                style={{ width: "100%", marginBottom: 8 }}
                onClick={() => handleSubscribe("monthly")}
                disabled={!!loading}
                id="subscribe-monthly-btn"
              >
                {loading === "sub-monthly" ? "Processing…" : "Start monthly — $7.99"}
              </button>
              <button
                className="primary-action"
                style={{ width: "100%", background: "#a84991" }}
                onClick={() => handleSubscribe("yearly")}
                disabled={!!loading}
                id="subscribe-yearly-btn"
              >
                {loading === "sub-yearly" ? "Processing…" : "Go yearly — $59.99"}
              </button>
            </>
          )}
        </article>

        <article className="plan-card">
          <p className="eyebrow">COIN BALANCE</p>
          <h2>◉ {viewer.coins}</h2>
          <p>Coins unlock individual episodes forever. Your balance is safely tracked in your account.</p>
          <div className="coin-packs">
            {coinPacks.map(({ pack, coins, price, popular }) => (
              <button
                key={pack}
                onClick={() => handleBuyCoins(pack)}
                disabled={!!loading}
                id={`buy-coins-${pack}`}
                style={popular ? { border: "1px solid #f473b5" } : undefined}
              >
                <b>◉ {coins}{popular && <span style={{ marginLeft: 6, fontSize: 10, color: "#f473b5" }}>POPULAR</span>}</b>
                <span>{price}</span>
              </button>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
