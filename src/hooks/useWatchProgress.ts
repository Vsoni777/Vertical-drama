import { useEffect } from "react";
import type { RefObject } from "react";
import { saveWatchProgress } from "../api/monetization";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  episodeId: number;
  seriesId: string;
  enabled: boolean;
  recordProgress: (
    seriesId: number,
    episodeId: number,
    seconds: number
  ) => void;
}

export function useWatchProgress({
  videoRef,
  episodeId,
  seriesId,
  enabled,
  recordProgress,
}: Props) {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const video = videoRef.current;

      if (!video || video.currentTime === 0) return;

      const seconds = Math.floor(video.currentTime);

      const completed =
        video.duration > 0 &&
        seconds >= video.duration - 10;

      void saveWatchProgress(
        episodeId,
        seconds,
        completed
      );

      recordProgress(
        Number(seriesId),
        episodeId,
        seconds
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [
    enabled,
    episodeId,
    seriesId,
    recordProgress,
    videoRef,
  ]);
}