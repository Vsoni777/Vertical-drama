import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useViewer } from "../hooks/useViewer";
import {
  purchaseCoins,
  createSubscription,
  cancelSubscription,
} from "../api/monetization";

type Plan = "monthly" | "yearly";
type CoinPack = "small" | "medium" | "large";

const coinPacks: Array<{
  pack: CoinPack;
  coins: number;
  price: string;
  popular?: boolean;
}> = [
  {
    pack: "small",
    coins: 50,
    price: "$2.99",
  },
  {
    pack: "medium",
    coins: 120,
    price: "$5.99",
    popular: true,
  },
  {
    pack: "large",
    coins: 300,
    price: "$11.99",
  },
];

export default function MembershipPage() {
  const viewer = useViewer();

  const [loading, setLoading] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (canceled === "true") {
      toast.error("Payment was canceled. You have not been charged.");

      setSearchParams({}, { replace: true });

      return;
    }

    if (success !== "true") {
      return;
    }

    let cancelled = false;

    const refreshAfterWebhook = async () => {
      const delays = [1000, 2000, 3000, 5000];

      for (const delay of delays) {
        if (cancelled) return;

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );

        if (cancelled) return;

        try {
          await viewer.refresh();
          break;
        } catch {
          console.warn(
            "Could not refresh viewer after payment. Retrying…"
          );
        }
      }

      if (cancelled) return;

      toast.success(
        "Payment successful! Your account is being updated."
      );

      setSearchParams({}, { replace: true });
    };

    refreshAfterWebhook();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, viewer]);

  const handleSubscribe = async (plan: Plan) => {
    setLoading(`sub-${plan}`);

    try {
      const response = await createSubscription(plan);
      const { data } = response.data;

      if (!data.checkout_url) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      window.location.assign(data.checkout_url);
    } catch (error: unknown) {
      const responseError = (
        error as {
          response?: {
            data?: {
              error?: string;
              message?: string;
            };
          };
        }
      )?.response?.data;

      const message =
        responseError?.error ||
        responseError?.message ||
        "Could not start subscription checkout.";

      toast.error(message);

      setLoading(null);
    }
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Cancel your subscription?"
    );

    if (!confirmed) {
      return;
    }

    setLoading("cancel");

    try {
      await cancelSubscription();
      await viewer.refresh();

      toast.success(
        "Subscription cancellation requested."
      );
    } catch (error: unknown) {
      const responseError = (
        error as {
          response?: {
            data?: {
              error?: string;
              message?: string;
            };
          };
        }
      )?.response?.data;

      toast.error(
        responseError?.error ||
          responseError?.message ||
          "Could not cancel subscription."
      );
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCoins = async (pack: CoinPack) => {
    setLoading(`coins-${pack}`);

    try {
      const response = await purchaseCoins(pack);
      const { data } = response.data;

      if (!data.checkout_url) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      window.location.assign(data.checkout_url);
    } catch (error: unknown) {
      const responseError = (
        error as {
          response?: {
            data?: {
              error?: string;
              message?: string;
            };
          };
        }
      )?.response?.data;

      toast.error(
        responseError?.error ||
          responseError?.message ||
          "Could not initiate coin purchase."
      );

      setLoading(null);
    }
  };

  const planName =
    viewer.subscriptionPlan === "yearly"
      ? "Yearly"
      : viewer.subscriptionPlan === "monthly"
        ? "Monthly"
        : "";

  const expiryDate = viewer.subscriptionEndsAt
    ? new Date(
        viewer.subscriptionEndsAt
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="content-page commerce-page">
      <p className="eyebrow">
        YOUR VIEWING PASS
      </p>

      <h1>Watch your way</h1>

      <p className="subcopy">
        Choose unlimited premium access or unlock
        only the episodes you love.
      </p>

      <p
        style={{
          marginBottom: 18,
          color: "#bdaec5",
          fontSize: 13,
        }}
      >
        Secure checkout is handled through Stripe.
        You will enter your card details on the Stripe
        page before your access is activated.
      </p>

      <section className="plan-grid">
        <article className="plan-card featured">
          <span className="plan-badge">
            BEST VALUE
          </span>

          <h2>Vivid Plus</h2>

          <p>
            Unlimited premium stories, ad-free viewing
            and priority releases.
          </p>

          <strong>
            $7.99 <small>/ month</small>
          </strong>

          {viewer.subscribed ? (
            <div>
              <p
                style={{
                  color: "#9cddb9",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                ✓ {planName} Subscription active
              </p>

              {expiryDate && (
                <p
                  style={{
                    color: "#8a7e93",
                    fontSize: 11,
                    marginBottom: 14,
                  }}
                >
                  Renews / Expires on {expiryDate}
                </p>
              )}

              <button
                className="primary-action"
                style={{
                  background: "#48253b",
                  color: "#ffd0e6",
                  width: "100%",
                }}
                onClick={handleCancel}
                disabled={loading === "cancel"}
                id="cancel-subscription-btn"
              >
                {loading === "cancel"
                  ? "Cancelling…"
                  : "Cancel plan"}
              </button>
            </div>
          ) : (
            <>
              <button
                className="primary-action"
                style={{
                  width: "100%",
                  marginBottom: 8,
                }}
                onClick={() =>
                  handleSubscribe("monthly")
                }
                disabled={!!loading}
                id="subscribe-monthly-btn"
              >
                {loading === "sub-monthly"
                  ? "Processing…"
                  : "Start monthly — $7.99"}
              </button>

              <button
                className="primary-action"
                style={{
                  width: "100%",
                  background: "#a84991",
                }}
                onClick={() =>
                  handleSubscribe("yearly")
                }
                disabled={!!loading}
                id="subscribe-yearly-btn"
              >
                {loading === "sub-yearly"
                  ? "Processing…"
                  : "Go yearly — $59.99"}
              </button>
            </>
          )}
        </article>

        <article className="plan-card">
          <p className="eyebrow">
            COIN BALANCE
          </p>

          <h2>◉ {viewer.coins}</h2>

          <p>
            Coins unlock individual episodes forever.
            Your balance is safely tracked in your
            account.
          </p>

          <div className="coin-packs">
            {coinPacks.map(
              ({
                pack,
                coins,
                price,
                popular,
              }) => (
                <button
                  key={pack}
                  onClick={() =>
                    handleBuyCoins(pack)
                  }
                  disabled={!!loading}
                  id={`buy-coins-${pack}`}
                  style={
                    popular
                      ? {
                          border:
                            "1px solid #f473b5",
                        }
                      : undefined
                  }
                >
                  <b>
                    ◉ {coins}

                    {popular && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 10,
                          color: "#f473b5",
                        }}
                      >
                        POPULAR
                      </span>
                    )}
                  </b>

                  <span>{price}</span>
                </button>
              )
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
