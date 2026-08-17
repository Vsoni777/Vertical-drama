import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useProtection(
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  const [isObscured, setIsObscured] = useState(false);
  const warningRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      const isCaptureShortcut =
        ((event.ctrlKey || event.metaKey) &&
          ["c", "s", "p"].includes(key)) ||
        key === "printscreen";

      if (!isCaptureShortcut) return;

      event.preventDefault();

      if (!warningRef.current) {
        warningRef.current = true;

        toast.error(
          "Protected content. Recording and redistribution are prohibited.",
          {
            id: "capture-warning",
          }
        );

        setTimeout(() => {
          warningRef.current = false;
        }, 2500);
      }
    };

    const onVisibilityChange = () => {
      const video = videoRef.current;

      if (document.visibilityState === "hidden") {
        setIsObscured(true);

        if (video && !video.paused) {
          video.pause();
        }
      } else {
        setIsObscured(false);
      }
    };

    const onBlur = () => {
      setIsObscured(true);
    };

    const onFocus = () => {
      setIsObscured(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [videoRef]);

  return {
    isObscured,
  };
}