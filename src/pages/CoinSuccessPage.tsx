/**
 * CoinSuccessPage — landing page after Stripe Checkout for coin purchase.
 * Reads session_id from the URL, calls /api/v1/coins/purchase/verify,
 * which credits the coins idempotently (webhook may have already done it).
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { verifyPurchase } from "../api/monetization";
import { useViewer } from "../hooks/useViewer";

export default function CoinSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const viewer         = useViewer();
  const sessionId      = searchParams.get("session_id") || "";

  const [status, setStatus]     = useState<"loading" | "success" | "error">("loading");
  const [coinsAdded, setCoinsAdded] = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }

    verifyPurchase(sessionId)
      .then((res) => {
        setCoinsAdded(res.data.data.coins_added);
        viewer.refresh(); // re-fetch /api/v1/me to update balance in header
        setStatus("success");
        toast.success(`◉ ${res.data.data.coins_added} coins added to your wallet!`);
      })
      .catch(() => {
        setStatus("error");
        toast.error("Could not verify purchase. Contact support if coins are missing.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="coin-success-page">
      <div className="coin-success-card">
        {status === "loading" && (
          <>
            <span className="reel-spinner" style={{ width: 48, height: 48 }} />
            <h2>Verifying payment…</h2>
            <p>Please wait while we confirm your purchase.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="coin-success-icon">◉</div>
            <h2>Payment successful!</h2>
            <p className="coin-success-amount">+{coinsAdded} coins</p>
            <p style={{ color: "#9d92a8", marginBottom: 28 }}>
              Your coins have been added to your wallet. Use them to unlock premium episodes.
            </p>
            <button
              className="primary-action"
              onClick={() => navigate("/dashboard")}
              id="coin-success-home-btn"
            >
              Back to dashboard
            </button>
            <Link to="/membership" className="text-button" style={{ display: "block", marginTop: 12, textAlign: "center" }}>
              View membership plans
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="coin-success-icon" style={{ filter: "grayscale(1)" }}>⚠️</div>
            <h2>Something went wrong</h2>
            <p style={{ color: "#9d92a8", marginBottom: 28 }}>
              We couldn't verify your purchase. If you were charged, your coins will be credited
              automatically within a few minutes via webhook.
            </p>
            <button
              className="primary-action"
              onClick={() => navigate("/membership")}
            >
              Back to plans
            </button>
          </>
        )}
      </div>
    </div>
  );
}
