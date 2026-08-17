import { useEffect, useState } from "react";
import { getSignedPlayback } from "../api/series";

interface UsePlaybackResult {
  playbackUrl: string;
  loading: boolean;
  error: string;
  reload: () => void;
}

export function usePlayback(
  seriesId: string,
  episodeId: number,
  enabled: boolean
): UsePlaybackResult {
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => {
    setPlaybackUrl("");
    setError("");
    setReloadKey((v) => v + 1);
  };

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const fetchPlayback = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSignedPlayback(
          seriesId,
          String(episodeId)
        );

        if (!cancelled) {
          setPlaybackUrl(
            response.data.data.playback_url
          );
        }
      } catch (err: any) {
        if (cancelled) return;

        const message =
          err?.response?.data?.error;

        const videoStatus =
          err?.response?.data?.video_status;

        if (
          videoStatus &&
          videoStatus !== "ready"
        ) {
          setError(
            `Video is ${videoStatus} — check back soon.`
          );
        } else {
          setError(
            message ??
              "Could not authorise playback."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlayback();

    return () => {
      cancelled = true;
    };
  }, [
    seriesId,
    episodeId,
    enabled,
    reloadKey,
  ]);

  return {
    playbackUrl,
    loading,
    error,
    reload,
  };
}