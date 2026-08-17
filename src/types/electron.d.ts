declare global {
  interface Window {
    process?: {
      versions?: {
        electron?: string;
      };
    };
    electron?: {
      setContentProtection?: (enabled: boolean) => void;
    };
  }
}

export {};
