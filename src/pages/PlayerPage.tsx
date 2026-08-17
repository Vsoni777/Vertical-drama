import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getEpisodes, unlockEpisode } from "../api/episodes";
import LockOverlay from "../components/player/LockOverlay";
import { usePlayback } from "../hooks/usePlayback";
import { useProtection } from "../hooks/useProtection";
import { useShaka } from "../hooks/useShaka";
import { useViewer } from "../hooks/useViewer";
import { useWatchProgress } from "../hooks/useWatchProgress";
import { useContentProtection } from "../hooks/useContentProtection";
import type { Episode } from "../types/Series";

interface SlideProps {
  episode: Episode;
  seriesId: string;
  isActive: boolean;
  isMuted: boolean;
  onEnded: () => void;
  onToggleMute: () => void;
  onUnlock: (ep: Episode) => Promise<void>;
  viewer: ReturnType<typeof useViewer>;
}

const getEpisodeNumber = (episode: Episode) => episode.episode_number ?? episode.number;
const getEpisodeCost = (episode: Episode) => episode.coin_cost ?? episode.coinCost ?? 0;

function EpisodeSlide({
  episode,
  seriesId,
  isActive,
  isMuted,
  onEnded,
  onToggleMute,
  onUnlock,
  viewer,
}: SlideProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isObscured } = useProtection(videoRef);
  const [unlocking, setUnlocking] = useState(false);
  const { recordProgress } = viewer;
  const episodeNumber = getEpisodeNumber(episode);

  const isLocked =
    (episode.locked ?? false) &&
    !viewer.unlockedIds.includes(episode.id) &&
    !viewer.subscribed;

  const { playbackUrl, loading, error: playError, reload } = usePlayback(
    seriesId,
    episode.id,
    isActive && !isLocked
  );

  useContentProtection(isActive && !isLocked);
  useWatchProgress({
    videoRef,
    episodeId: episode.id,
    seriesId,
    enabled: isActive && !!playbackUrl,
    recordProgress,
  });
  useShaka(videoRef, playbackUrl, isActive && !isLocked);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  const handleUnlock = useCallback(async () => {
    setUnlocking(true);

    try {
      await onUnlock(episode);
    } finally {
      setUnlocking(false);
    }
  }, [episode, onUnlock]);

  if (isLocked) {
    return (
      <div className="reel-slide" aria-hidden={!isActive}>
        <LockOverlay
          episode={episode}
          viewer={viewer}
          unlocking={unlocking}
          onUnlock={handleUnlock}
          onSubscribe={() => navigate("/membership")}
        />
      </div>
    );
  }

  const videoStyle = {
    filter: isObscured ? "blur(30px) grayscale(100%)" : "none",
    opacity: isObscured ? 0 : 1,
    transition: "filter 0.1s, opacity 0.1s",
  };

  const warningStyle = {
    position: "absolute" as const,
    inset: 0,
    background: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    textAlign: "center" as const,
    padding: 20,
  };

  return (
    <div className="reel-slide" aria-hidden={!isActive}>
      <video
        ref={videoRef}
        className="reel-video"
        playsInline
        muted={isMuted}
        preload="metadata"
        crossOrigin="anonymous"
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        onEnded={onEnded}
        style={videoStyle}
        onClick={() => {
          if (isObscured) return;

          const video = videoRef.current;
          if (!video) return;

          if (video.paused) {
            void video.play();
          } else {
            video.pause();
          }
        }}
      />

      {isObscured && (
        <div style={warningStyle}>
          <span style={{ fontSize: 48, marginBottom: 16 }}>🛡️</span>
          <h2>Content Protected</h2>
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            Protected content. Recording and redistribution are prohibited.
          </p>
        </div>
      )}

      {isActive && playbackUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "linear-gradient(transparent, rgba(10, 8, 16, 0.28))",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 14,
              bottom: 18,
              background: "rgba(13, 10, 18, 0.45)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.85)",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Vivid • Confidential
          </div>
        </div>
      )}

      {isActive && loading && !isLocked && (
        <div className="reel-loading">
          <span className="reel-spinner" />
          <p>Authorising stream…</p>
        </div>
      )}

      {isActive && playError && !isLocked && (
        <div className="reel-loading">
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ textAlign: "center", maxWidth: 260 }}>{playError}</p>
          <button className="reel-sub-btn" style={{ marginTop: 12 }} onClick={reload}>
            Retry
          </button>
        </div>
      )}

      <div className="reel-info">
        <Link to={`/series/${seriesId}`} className="reel-series-link" id="reel-back-btn">
          ← Back to series
        </Link>
        <p className="reel-ep-label">Episode {episodeNumber}</p>
        <h2 className="reel-ep-title">{episode.title}</h2>
        {episode.description && <p className="reel-ep-desc">{episode.description}</p>}
      </div>

      <div className="reel-actions">
        <button
          className="reel-action-btn"
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          id="reel-mute-btn"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
        <button
          className="reel-action-btn"
          onClick={() => navigate(`/series/${seriesId}`)}
          aria-label="Episode list"
          id="reel-list-btn"
        >
          ☰
        </button>
      </div>

      {isActive && playbackUrl && (
        <div className="reel-swipe-hint" key={`hint-${episode.id}`}>
          <span>↑ swipe for next</span>
        </div>
      )}
    </div>
  );
}

export default function PlayerPage() {
  const { seriesId = "", episodeId = "" } = useParams();
  const navigate = useNavigate();
  const viewer = useViewer();

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelCooldown = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingList(true);

    getEpisodes(seriesId)
      .then((res) => {
        if (!active) return;

        const eps: Episode[] = (res.data as { data?: Episode[] }).data ?? [];
        setEpisodes(eps);

        const nextIndex = eps.findIndex((ep) => String(ep.id) === episodeId);
        setActiveIdx(nextIndex >= 0 ? nextIndex : 0);
      })
      .catch(() => {
        toast.error("Could not load episodes.");
      })
      .finally(() => {
        if (active) {
          setLoadingList(false);
        }
      });

    return () => {
      active = false;
    };
  }, [seriesId, episodeId]);

  const goToIndex = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= episodes.length || isTransitioning) return;

      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }

      setIsTransitioning(true);
      setActiveIdx(idx);

      const episode = episodes[idx];
      if (episode) {
        navigate(`/watch/${seriesId}/${episode.id}`, { replace: true });
      }

      transitionTimerRef.current = window.setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    },
    [episodes, isTransitioning, navigate, seriesId]
  );

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const goNext = useCallback(() => goToIndex(activeIdx + 1), [activeIdx, goToIndex]);
  const goPrev = useCallback(() => goToIndex(activeIdx - 1), [activeIdx, goToIndex]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (wheelCooldown.current) return;

      wheelCooldown.current = true;
      window.setTimeout(() => {
        wheelCooldown.current = false;
      }, 650);

      if (event.deltaY > 20) {
        goNext();
      } else if (event.deltaY < -20) {
        goPrev();
      }
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartY.current = event.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (touchStartY.current === null) return;

    const diff = touchStartY.current - event.changedTouches[0].clientY;
    touchStartY.current = null;

    if (Math.abs(diff) < 50) return;
    if (diff > 0) {
      goNext();
    } else {
      goPrev();
    }
  }, [goNext, goPrev]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const handleUnlock = useCallback(
    async (episode: Episode) => {
      const cost = getEpisodeCost(episode);

      if (viewer.coins < cost) {
        toast.error(`Need ◉ ${cost} — you have ◉ ${viewer.coins}`);
        navigate("/membership");
        return;
      }

      try {
        await unlockEpisode(seriesId, String(episode.id));
        viewer.markUnlocked(episode.id);
        viewer.deductCoins(cost);
        viewer.refresh();
        toast.success("Episode unlocked!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast.error(msg ?? "Could not unlock");
      }
    },
    [navigate, seriesId, viewer]
  );

  const navigationButtons = useMemo(
    () => ({
      showPrev: activeIdx > 0,
      showNext: activeIdx < episodes.length - 1,
    }),
    [activeIdx, episodes.length]
  );

  if (loadingList) {
    return (
      <div className="reel-container reel-loading-screen">
        <span className="reel-spinner" />
        <p>Loading episodes…</p>
      </div>
    );
  }

  if (!episodes.length) {
    return (
      <div className="reel-container reel-loading-screen">
        <p style={{ color: "#9d92a8" }}>No episodes found.</p>
        <button className="reel-sub-btn" onClick={() => navigate(`/series/${seriesId}`)}>
          Back to series
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="reel-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      id="reel-player"
    >
      <div className="reel-track" style={{ transform: `translateY(${-activeIdx * 100}dvh)` }}>
        {episodes.map((episode, index) => (
          <EpisodeSlide
            key={episode.id}
            episode={episode}
            seriesId={seriesId}
            isActive={index === activeIdx}
            isMuted={isMuted}
            onEnded={goNext}
            onToggleMute={() => setIsMuted((muted) => !muted)}
            onUnlock={handleUnlock}
            viewer={viewer}
          />
        ))}
      </div>

      <div className="reel-dots" aria-label="Episode navigation">
        {episodes.map((episode, index) => (
          <button
            key={episode.id}
            className={`reel-dot ${index === activeIdx ? "active" : ""}`}
            onClick={() => goToIndex(index)}
            aria-label={`Episode ${getEpisodeNumber(episode)}`}
            title={episode.title}
          />
        ))}
      </div>

      {navigationButtons.showPrev && (
        <button
          className="reel-nav reel-nav--up"
          onClick={goPrev}
          id="reel-prev-btn"
          aria-label="Previous episode"
        >
          ↑
        </button>
      )}

      {navigationButtons.showNext && (
        <button
          className="reel-nav reel-nav--down"
          onClick={goNext}
          id="reel-next-btn"
          aria-label="Next episode"
        >
          ↓
        </button>
      )}

      {isMuted && episodes.length > 0 && (
        <div className="reel-unmute-prompt" onClick={() => setIsMuted(false)}>
          🔇 Tap to unmute
        </div>
      )}
    </div>
  );
}
