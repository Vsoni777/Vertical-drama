export type AccessType = "free" | "coins" | "subscription" | "reward";

export interface Episode {
  id: number;
  series_id?: number;
  number: number;
  title: string;
  duration: string | number;
  access: AccessType;
  coinCost?: number;
  coin_cost?: number;
  description?: string;
  progress?: number;
  progress_seconds?: number;
  completed?: boolean;
  unlocked?: boolean;
  video_url?: string;
  playback_url?: string;
  mux_playback_id?: string;
  locked?: boolean;
  episode_number?: number;
  video_status?: "pending" | "uploading" | "processing" | "ready" | "errored";
  scheduled_at?: string | null;
  release_at?: string | null;
  released_at?: string | null;
  published_at?: string | null;
}

export interface Series {
  id: number;
  title: string;
  description: string;
  genre: string;
  episodeCount: number;
  completed: boolean;
  coverClass: string;
  match?: number;
  episodes: Episode[];
  thumbnail_url?: string;
  cover_url?: string;
  status?: string;
  is_published?: boolean;
  cover_image?: string;
  banner_image?: string;
}
