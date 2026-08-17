import { useEffect } from "react";

export function isElectronRuntime(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const electronVersion = (
    window as Window & {
      process?: { versions?: { electron?: string } };
    }
  ).process?.versions?.electron;

  return Boolean(electronVersion || userAgent.includes("Electron"));
}

export function setContentProtection(enabled: boolean): boolean {
  if (!isElectronRuntime()) return false;

  const bridge = (window as Window & {
    electron?: {
      setContentProtection?: (enabled: boolean) => void;
    };
  }).electron;

  if (!bridge?.setContentProtection) return false;

  bridge.setContentProtection(enabled);
  return true;
}

export function useContentProtection(enabled: boolean) {
  useEffect(() => {
    const isActive = enabled && isElectronRuntime();

    if (isActive) {
      setContentProtection(true);
    }

    return () => {
      if (isActive) {
        setContentProtection(false);
      }
    };
  }, [enabled]);
}
