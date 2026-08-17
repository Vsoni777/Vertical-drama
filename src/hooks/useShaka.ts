import { useEffect, useRef } from "react";
import shaka from "shaka-player";

export function useShaka(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  manifestUrl: string,
  active: boolean
) {
  const playerRef = useRef<shaka.Player | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !manifestUrl || !active) {
      playerRef.current?.destroy();
      playerRef.current = null;
      return;
    }

    const initPlayer = async () => {
      try {
        shaka.polyfill.installAll();

        const player = new shaka.Player(video);
        playerRef.current = player;

        player.addEventListener("error", (event: any) => {
          console.error("Shaka Error:", event.detail);
        });

        await player.load(manifestUrl);

        await video.play().catch(() => {});
      } catch (error) {
        console.error("Shaka load error:", error);
      }
    };

    initPlayer();

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [manifestUrl, active]);
}