import api from "./api";

export const getEpisodes = (
  seriesId: string
) =>
  api.get(
    `/api/v1/series/${seriesId}/episodes`
  );

export const getEpisode = (
  seriesId: string,
  episodeId: string
) =>
  api.get(
    `/api/v1/series/${seriesId}/episodes/${episodeId}`
  );

export const createEpisode = (
  seriesId: string,
  payload: FormData
) =>
  api.post(
    `/api/v1/series/${seriesId}/episodes`,
    payload
  );

export const updateEpisode = (
  seriesId: string,
  episodeId: string,
  payload: FormData
) =>
  api.patch(
    `/api/v1/series/${seriesId}/episodes/${episodeId}`,
    payload
  );

export const deleteEpisode = (
  seriesId: string,
  episodeId: string
) =>
  api.delete(
    `/api/v1/series/${seriesId}/episodes/${episodeId}`
  );


export const createEpisodeUpload = (
  seriesId: string,
  episodeId: string
) =>
  api.post(
    `/api/v1/series/${seriesId}/episodes/${episodeId}/upload`
  );

export const unlockEpisode = (
  seriesId: string,
  episodeId: string
) =>
  api.post<{ data: { episode_id: number; coin_balance: number } }>(
    `/api/v1/series/${seriesId}/episodes/${episodeId}/unlock`
  );

export const getPlayback = (
  seriesId: string,
  episodeId: string
) =>
  api.get(
    `/api/v1/series/${seriesId}/episodes/${episodeId}/playback`
  );

export const getSignedPlayback = (
  seriesId: string,
  episodeId: string
) =>
  api.get<{ data: { playback_url: string } }>(
    `/api/v1/series/${seriesId}/episodes/${episodeId}/playback`
  );