import type { Episode } from "../types/Series";

interface Props {
  episode: Episode;
  onWatch: () => void;
  onUnlock: () => void;
}

export default function EpisodeCard({ episode, onWatch, onUnlock }: Props) {
  const locked = episode.access !== "free";
  const label = episode.access === "coins" ? `${episode.coinCost} coins` : episode.access === "subscription" ? "Premium" : "Watch an ad";

  return (
    <article className="episode-card">
      <button className="episode-thumb" onClick={locked ? onUnlock : onWatch} aria-label={`Play ${episode.title}`}>
        <span className="episode-number">{String(episode.number).padStart(2, "0")}</span>
        <span className="play-icon">{locked ? "🔒" : "▶"}</span>
        {episode.progress ? <span className="progress"><i style={{ width: `${episode.progress}%` }} /></span> : null}
      </button>
      <div className="episode-copy">
        <p>Episode {episode.number}</p>
        <h3>{episode.title}</h3>
        <span>{episode.duration}</span>
      </div>
      {locked ? <button className="episode-unlock" onClick={onUnlock}>{label}</button> : <button className="text-button" onClick={onWatch}>Watch</button>}
    </article>
  );
}
