import type { Episode } from "../../types/Series";
import { useViewer } from "../../hooks/useViewer";

interface Props {
  episode: Episode;
  viewer: ReturnType<typeof useViewer>;
  unlocking: boolean;
  onUnlock: () => void;
  onSubscribe: () => void;
}

export default function LockOverlay({ episode, viewer, unlocking, onUnlock, onSubscribe, }: Props) {
  const cost = episode.coin_cost ?? episode.coinCost ?? 0;

  return (
    <div className="reel-locked-overlay">
      <div className="reel-lock-card">
        <span className="reel-lock-icon">
          🔒
        </span>

        <p className="reel-lock-ep">
          Episode{" "}
          {episode.episode_number ??
            episode.number}
        </p>

        <h2 className="reel-lock-title">
          {episode.title}
        </h2>

        {cost > 0 ? (
          <>
            <p className="reel-lock-copy">
              Unlock with coins —
              your balance:
              <strong>
                {" "}
                ◉ {viewer.coins}
              </strong>
            </p>

            <button
              className="reel-unlock-btn"
              onClick={onUnlock}
              disabled={unlocking}
            >
              {unlocking
                ? "Unlocking..."
                : `◉ ${cost} — Unlock`}
            </button>

            <button
              className="reel-sub-btn"
              onClick={onSubscribe}
            >
              Or subscribe for unlimited access
            </button>
          </>
        ) : (
          <>
            <p className="reel-lock-copy">
              This episode requires a
              subscription.
            </p>

            <button
              className="reel-sub-btn reel-sub-btn--primary"
              onClick={onSubscribe}
            >
              View plans →
            </button>
          </>
        )}
      </div>
    </div>
  );
}