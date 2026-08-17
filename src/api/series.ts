import api from "./api";
import type { Series } from "../types/Series";

const resource = <T,>(payload: unknown): T => {
  const item = payload as { data?: { attributes?: T } & T };
  return (item.data?.attributes ?? item.data ?? payload) as T;
};

export const unwrapCollection = <T,>(payload: unknown): T[] => {
  const body = payload as { data?: unknown; series?: unknown };
  const items = Array.isArray(body.data) ? body.data : Array.isArray(body.series) ? body.series : Array.isArray(payload) ? payload : [];
  return items.map((item) => resource<T>(item));
};

export const normaliseSeries = (item: Series): Series => ({
  ...item,
  cover_url: item.cover_url || item.thumbnail_url || item.banner_image || item.cover_image,
  thumbnail_url: item.thumbnail_url || item.cover_url || item.banner_image || item.cover_image,
  status: item.status || (item.is_published ? "Published" : "Draft"),
  episodeCount: item.episodeCount || item.episodes?.length || 0,
});

export const getSeries = (page = 1) =>
  api.get<unknown>(`/api/v1/series?page=${page}`).then((response) => unwrapCollection<Series>(response.data).map(normaliseSeries));

export const getSeriesById = (
  id: string
) => api.get<unknown>(`/api/v1/series/${id}`).then((response) => normaliseSeries(resource<Series>(response.data)));

export const createSeries = (
  payload: FormData
) => api.post("/api/v1/series", payload);

export const updateSeries = (
  id: string,
  payload: FormData
) =>
  api.patch(
    `/api/v1/series/${id}`,
    payload
  );

export const deleteSeries = (
  id: string
) => api.delete(`/api/v1/series/${id}`);

export const unlockEpisode = (seriesId: string, episodeId: string) =>
  api.post(`/api/v1/series/${seriesId}/episodes/${episodeId}/unlock`);

// The server validates access, then returns a short-lived signed HLS URL.
export const getSignedPlayback = (seriesId: string, episodeId: string) =>
  api.get<{ data: { playback_url: string } }>(`/api/v1/series/${seriesId}/episodes/${episodeId}/playback`);
