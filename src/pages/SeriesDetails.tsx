import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import EpisodeCard from "../components/EpisodeCard";
import { getEpisodes, unlockEpisode } from "../api/episodes";
import { getSeriesById, unwrapCollection } from "../api/series";
import type { Episode, Series } from "../types/Series";
import { seriesCoverClass } from "./SeriesList";
import { useViewer } from "../hooks/useViewer";

export default function SeriesDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const viewer = useViewer();

  const [series,   setSeries]   = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [unlocking, setUnlocking] = useState<number | null>(null);

  const loadData = () => {
    let active = true;
    Promise.all([getSeriesById(id), getEpisodes(id)])
      .then(([item, episodeResponse]) => {
        if (!active) return;
        setSeries(item);
        setEpisodes(
          unwrapCollection<Episode>(episodeResponse.data).map((ep) => ({
            ...ep,
            number:   ep.number || ep.episode_number || 0,
            duration: ep.duration ? `${ep.duration}s` : "—",
          }))
        );
      })
      .catch(() => active && setError("We couldn't load this series."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  };

  useEffect(loadData, [id]);

  const watch = (episodeId: number) => navigate(`/watch/${id}/${episodeId}`);

  const handleUnlock = async (episode: Episode) => {
    // Already unlocked or free
    if (!episode.locked || viewer.unlockedIds.includes(episode.id) || viewer.subscribed) {
      watch(episode.id);
      return;
    }

    const cost = episode.coin_cost ?? episode.coinCost ?? 0;
    if (cost === 0) { watch(episode.id); return; }

    if (viewer.coins < cost) {
      toast.error(`You need ${cost} coins. You have ${viewer.coins}.`);
      navigate("/membership");
      return;
    }

    setUnlocking(episode.id);
    try {
      await unlockEpisode(id, String(episode.id));
      viewer.markUnlocked(episode.id);
      viewer.deductCoins(cost);
      viewer.refresh();
      toast.success("Episode unlocked!");
      watch(episode.id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Could not unlock episode");
    } finally {
      setUnlocking(null);
    }
  };

  if (loading)          return <main className="content-page"><p className="empty-state">Loading series…</p></main>;
  if (!series || error) return (
    <main className="content-page">
      <Link to="/dashboard" className="back-link">← Browse</Link>
      <p className="error-state">{error || "Series not found."}</p>
    </main>
  );

  return (
    <main className="details-page">
      <section
        className={`series-hero ${seriesCoverClass(series)}`}
        style={
          series.cover_url || series.thumbnail_url
            ? {
                backgroundImage: `linear-gradient(90deg, #170d21 2%, #170d21bb 40%, transparent 80%), url(${series.cover_url || series.thumbnail_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="hero-overlay" />
        <Link to="/dashboard" className="back-link">← Browse</Link>
        <div className="hero-content">
          <span className="eyebrow">{series.genre || "DRAMA"}</span>
          <h1>{series.title}</h1>
          <p>{series.description}</p>
          <div className="hero-meta">
            <span>{episodes.length || series.episodeCount || 0} episodes</span>
            <span>{series.completed ? "Completed" : series.status || "Published"}</span>
          </div>
          <div className="hero-actions">
            {episodes[0] && (
              <button className="primary-action" onClick={() => watch(episodes[0].id)}>
                ▶ Start watching
              </button>
            )}
            <button
              className={`round-action ${viewer.savedIds.includes(series.id) ? "saved" : ""}`}
              onClick={() => viewer.toggleSaved(series.id)}
              aria-label="Save series"
            >
              {viewer.savedIds.includes(series.id) ? "✓" : "+"}
            </button>
          </div>
        </div>
      </section>

      <section className="episode-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">EPISODES</p>
            <h2>Season 1</h2>
          </div>
          <span>{episodes.length} available</span>
        </div>

        {viewer.subscribed && (
          <div className="access-note">
            <span>✓</span>
            <p>You have <strong>Vivid Plus</strong> — all premium episodes are unlocked.</p>
          </div>
        )}

        <div className="episode-list">
          {episodes.map((episode, index) => {
            const locked     = (episode.locked ?? false) && !viewer.unlockedIds.includes(episode.id) && !viewer.subscribed;
            const coinCost   = episode.coin_cost ?? episode.coinCost ?? 0;
            const accessType = locked ? (coinCost > 0 ? "coins" : "subscription") : "free";

            return (
              <EpisodeCard
                key={episode.id}
                episode={{
                  ...episode,
                  number:   episode.number || index + 1,
                  access:   accessType,
                  coinCost: coinCost,
                }}
                onWatch={() => watch(episode.id)}
                onUnlock={() => {
                  if (unlocking === episode.id) return;
                  void handleUnlock(episode);
                }}
              />
            );
          })}
        </div>
        {!episodes.length && <p className="empty-state">No episodes published yet.</p>}
      </section>
    </main>
  );
}
