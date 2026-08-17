import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  createEpisode,
  createEpisodeUpload,
  deleteEpisode,
  getEpisodes,
  updateEpisode,
} from "../api/episodes";
import {
  createSeries,
  deleteSeries,
  getSeries,
  unwrapCollection,
  updateSeries,
} from "../api/series";
import type { Episode, Series } from "../types/Series";

type SeriesForm  = { title: string; description: string; genre: string; is_published: boolean };
type EpisodeForm = { title: string; episode_number: string; description: string; locked: boolean; coin_cost: string; release_at: string };

const BLANK_SERIES:  SeriesForm  = { title: "", description: "", genre: "", is_published: false };
const BLANK_EPISODE: EpisodeForm = { title: "", episode_number: "", description: "", locked: false, coin_cost: "0", release_at: "" };

function toFormData(key: string, values: Record<string, string | boolean>): FormData {
  const fd = new FormData();
  Object.entries(values).forEach(([field, value]) => fd.append(`${key}[${field}]`, String(value)));
  return fd;
}

function buildEpisodePayload(episodeForm: EpisodeForm): FormData {
  const payload = toFormData("episode", {
    title: episodeForm.title,
    episode_number: episodeForm.episode_number,
    description: episodeForm.description,
    locked: episodeForm.locked,
    coin_cost: episodeForm.coin_cost,
    release_at: episodeForm.release_at,
    scheduled_at: episodeForm.release_at,
  });

  if (episodeForm.release_at) {
    payload.append("episode[release_at]", episodeForm.release_at);
    payload.append("episode[scheduled_at]", episodeForm.release_at);
  }

  return payload;
}

type UploadState = { episodeId: number; percent: number; done: boolean; error: boolean };

export default function AdminPage() {
  const [tab, setTab] = useState<"series" | "episodes">("episodes");

  const [seriesList,    setSeriesList]    = useState<Series[]>([]);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [seriesForm,    setSeriesForm]    = useState<SeriesForm>(BLANK_SERIES);
  const [savingSeries,  setSavingSeries]  = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [episodes,         setEpisodes]          = useState<Episode[]>([]);
  const [editingEpisode,   setEditingEpisode]    = useState<Episode | null>(null);
  const [episodeForm,      setEpisodeForm]       = useState<EpisodeForm>(BLANK_EPISODE);
  const [videoFile,        setVideoFile]         = useState<File | null>(null);
  const [savingEpisode,    setSavingEpisode]     = useState(false);
  const [uploads,          setUploads]           = useState<Record<number, UploadState>>({});
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const loadSeries = async () => {
    try {
      const items = await getSeries();
      setSeriesList(items);
      if (!selectedSeriesId && items[0]) setSelectedSeriesId(String(items[0].id));
    } catch {
      toast.error("Unable to load series.");
    }
  };

  const loadEpisodes = async (sid = selectedSeriesId) => {
    if (!sid) return;
    try {
      const res = await getEpisodes(sid);
      setEpisodes(unwrapCollection<Episode>(res.data));
    } catch {
      toast.error("Unable to load episodes.");
    }
  };

  useEffect(() => { void loadSeries(); }, []);
  useEffect(() => { void loadEpisodes(); }, [selectedSeriesId]);

  const submitSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSeries(true);
    try {
      const payload = toFormData("series", {
        title: seriesForm.title,
        description: seriesForm.description,
        genre: seriesForm.genre,
        is_published: seriesForm.is_published,
      });
      // Attach thumbnail image file if selected
      if (thumbnailFile) payload.append("series[thumbnail_image]", thumbnailFile);

      if (editingSeries) {
        await updateSeries(String(editingSeries.id), payload);
        toast.success("Series updated");
      } else {
        await createSeries(payload);
        toast.success("Series created");
      }
      setEditingSeries(null);
      setSeriesForm(BLANK_SERIES);
      setThumbnailFile(null);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      void loadSeries();
    } catch {
      toast.error("Could not save series.");
    } finally {
      setSavingSeries(false);
    }
  };

  const startSeriesEdit = (item: Series) => {
    setEditingSeries(item);
    setThumbnailFile(null);
    setSeriesForm({
      title:        item.title        || "",
      description:  item.description  || "",
      genre:        item.genre        || "",
      is_published: item.is_published ?? item.status === "Published",
    });
  };

  const uploadVideo = async (episodeId: number, file: File) => {
    setUploads((prev) => ({ ...prev, [episodeId]: { episodeId, percent: 0, done: false, error: false } }));
    try {
      const { data } = await createEpisodeUpload(selectedSeriesId, String(episodeId));
      const uploadUrl = data.data.upload_url;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploads((prev) => ({ ...prev, [episodeId]: { ...prev[episodeId], percent } }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((prev) => ({ ...prev, [episodeId]: { ...prev[episodeId], percent: 100, done: true } }));
            toast.success("Upload complete — Mux is processing the video.");
            resolve();
          } else {
            reject(new Error(`Mux upload returned HTTP ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.send(file);
      });

      void loadEpisodes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
      setUploads((prev) => ({ ...prev, [episodeId]: { ...prev[episodeId], error: true } }));
    }
  };

  const submitEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId) return;
    setSavingEpisode(true);

    try {
      let episodeId: number;

      const payload = buildEpisodePayload(episodeForm);

      if (editingEpisode) {
        await updateEpisode(
          selectedSeriesId,
          String(editingEpisode.id),
          payload
        );
        episodeId = editingEpisode.id;
        toast.success("Episode updated");
      } else {
        const res = await createEpisode(
          selectedSeriesId,
          payload
        );
        const created = (res.data as any)?.data ?? res.data;
        episodeId = created.id as number;
        toast.success("Episode created");
      }

      setEditingEpisode(null);
      setEpisodeForm(BLANK_EPISODE);
      void loadEpisodes();

      if (videoFile) {
        void uploadVideo(episodeId, videoFile);
        setVideoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error: any) {
      const msg = error?.response?.data?.errors?.[0] || "Could not save episode.";
      toast.error(msg);
    } finally {
      setSavingEpisode(false);
    }
  };

  const startEpisodeEdit = (item: Episode) => {
    const releaseDate = item.scheduled_at || item.release_at || item.released_at || item.published_at || "";

    setEditingEpisode(item);
    setEpisodeForm({
      title:          item.title                               || "",
      episode_number: String(item.episode_number ?? item.number ?? ""),
      description:    item.description                        || "",
      locked:         item.locked                             ?? false,
      coin_cost:      String(item.coin_cost ?? item.coinCost  ?? 0),
      release_at:     releaseDate ? new Date(releaseDate).toISOString().slice(0, 16) : "",
    });
  };

  const reUpload = (episode: Episode) => {
    if (!videoFile) { toast.error("Select a video file first."); return; }
    void uploadVideo(episode.id, videoFile);
    setVideoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div>
          <p className="eyebrow">ADMIN PORTAL</p>
          <h1>Content Studio</h1>
        </div>
        {(["series", "episodes"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            id={`admin-tab-${t}`}
          >
            {t === "series" ? "Series management" : "Episode management"}
          </button>
        ))}
      </aside>

      <section className="admin-content">

        {tab === "series" && (
          <>
            <div className="admin-title">
              <div>
                <p className="eyebrow">CATALOGUE</p>
                <h2>{editingSeries ? "Edit series" : "Create series"}</h2>
              </div>
            </div>

            <form className="admin-form" onSubmit={submitSeries}>
              <input
                required
                id="series-title"
                placeholder="Title"
                value={seriesForm.title}
                onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
              />
              <input
                id="series-genre"
                placeholder="Genre (e.g. Romance)"
                value={seriesForm.genre}
                onChange={(e) => setSeriesForm({ ...seriesForm, genre: e.target.value })}
              />
              <div className="upload-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="series-thumbnail">Series thumbnail image</label>
                <input
                  id="series-thumbnail"
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                />
                {thumbnailFile && (
                  <span className="upload-file-name">🖼 {thumbnailFile.name}</span>
                )}
                {!thumbnailFile && editingSeries?.thumbnail_url && (
                  <img src={editingSeries.thumbnail_url} alt="Current thumbnail" style={{ height: 60, borderRadius: 6, marginTop: 6 }} />
                )}
                <small>JPG, PNG, or WebP. Shown on series cards.</small>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={seriesForm.is_published}
                  onChange={(e) => setSeriesForm({ ...seriesForm, is_published: e.target.checked })}
                />
                Publish now
              </label>
              <textarea
                placeholder="Description"
                value={seriesForm.description}
                onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
              />
              <button
                id="series-submit"
                disabled={savingSeries}
                className="primary-action"
              >
                {savingSeries ? "Saving…" : editingSeries ? "Save changes" : "Create series"}
              </button>
              {editingSeries && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => { setEditingSeries(null); setSeriesForm(BLANK_SERIES); }}
                >
                  Cancel
                </button>
              )}
            </form>

            <h3 className="admin-list-title">All series</h3>
            <div className="table-card">
              <div className="table-row heading">
                <span>Title</span>
                <span>Status</span>
                <span>Episodes</span>
                <span>Actions</span>
              </div>
              {seriesList.map((item) => (
                <div className="table-row" key={item.id}>
                  <b>{item.title}</b>
                  <span className="status live">{item.status || "Published"}</span>
                  <span>{item.episodeCount || item.episodes?.length || 0}</span>
                  <span>
                    <button className="text-button" onClick={() => startSeriesEdit(item)}>Edit</button>
                    <button
                      className="text-button danger"
                      onClick={async () => {
                        if (!confirm(`Delete "${item.title}"?`)) return;
                        await deleteSeries(String(item.id));
                        toast.success("Series deleted");
                        void loadSeries();
                      }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
              {!seriesList.length && <p className="empty-state">No series yet.</p>}
            </div>
          </>
        )}

        {tab === "episodes" && (
          <>
            <div className="admin-title">
              <div>
                <p className="eyebrow">EPISODES</p>
                <h2>{editingEpisode ? "Edit episode" : "Add episode"}</h2>
              </div>
              <select
                id="series-select"
                className="series-picker"
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
              >
                {seriesList.map((s) => (
                  <option value={s.id} key={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <form className="admin-form" onSubmit={submitEpisode}>
              <label className="admin-field admin-field-half">
                <span>Episode title</span>
                <input
                  id="ep-title"
                  required
                  placeholder="Episode title"
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                />
              </label>

              <label className="admin-field admin-field-half">
                <span>Episode number</span>
                <input
                  id="ep-number"
                  required
                  type="number"
                  min="1"
                  placeholder="Episode number"
                  value={episodeForm.episode_number}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, episode_number: e.target.value })}
                />
              </label>

              <label className="admin-field admin-field-half">
                <span>Coin cost</span>
                <input
                  id="ep-coin-cost"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={episodeForm.coin_cost}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, coin_cost: e.target.value })}
                />
              </label>

              <label className="admin-field admin-field-half checkbox-field">
                <input
                  type="checkbox"
                  checked={episodeForm.locked}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, locked: e.target.checked })}
                />
                <span>Lock episode (requires coin unlock or subscription)</span>
              </label>

              <label className="admin-field admin-field-full" htmlFor="ep-release-at">
                <span>Scheduled release</span>
                <input
                  id="ep-release-at"
                  type="datetime-local"
                  value={episodeForm.release_at}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, release_at: e.target.value })}
                />
              </label>

              <label className="admin-field admin-field-full">
                <span>Description (optional)</span>
                <textarea
                  id="ep-description"
                  placeholder="Description (optional)"
                  value={episodeForm.description}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                />
              </label>

              <div className="admin-field admin-field-full upload-field">
                <label htmlFor="ep-video-file">
                  {editingEpisode ? "Replace video (optional)" : "Video file"}
                </label>
                <input
                  id="ep-video-file"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
                {videoFile && (
                  <span className="upload-file-name">
                    📹 {videoFile.name} ({(videoFile.size / 1_000_000).toFixed(1)} MB)
                  </span>
                )}
                <small>
                  {editingEpisode
                    ? "Leave blank to keep existing video."
                    : "Video will upload to Mux automatically after the episode is created."}
                </small>
              </div>

              <button
                id="ep-submit"
                disabled={savingEpisode || !selectedSeriesId}
                className="primary-action"
              >
                {savingEpisode
                  ? (videoFile ? "Creating & uploading…" : "Saving…")
                  : editingEpisode
                    ? "Save changes"
                    : videoFile
                      ? "Create & upload video"
                      : "Create episode"}
              </button>
              {editingEpisode && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => { setEditingEpisode(null); setEpisodeForm(BLANK_EPISODE); setVideoFile(null); }}
                >
                  Cancel
                </button>
              )}
            </form>

            {Object.values(uploads).some((u) => !u.done && !u.error) && (
              <div className="upload-progress-list">
                {Object.values(uploads).filter((u) => !u.done && !u.error).map((u) => (
                  <div className="upload-progress-item" key={u.episodeId}>
                    <span>Uploading episode {u.episodeId}…</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${u.percent}%` }} />
                    </div>
                    <span className="progress-pct">{u.percent}%</span>
                  </div>
                ))}
              </div>
            )}

            <h3 className="admin-list-title">Episodes in series</h3>
            <div className="table-card">
              <div className="table-row heading">
                <span>Episode</span>
                <span>Access</span>
                <span>Video status</span>
                <span>Actions</span>
              </div>
              {episodes.map((ep) => {
                const upload = uploads[ep.id];
                const releaseDate = ep.scheduled_at || ep.release_at || ep.released_at || ep.published_at;
                const isScheduled = Boolean(releaseDate) && new Date(releaseDate as string).getTime() > Date.now();
                return (
                  <div className="table-row" key={ep.id}>
                    <b>{ep.episode_number ?? ep.number}. {ep.title}</b>
                    <span className={`status ${ep.locked ? "" : "live"}`}>
                      {isScheduled
                        ? `🗓 Scheduled`
                        : ep.locked
                          ? `🔒 ${ep.coin_cost ?? ep.coinCost ?? 0} coins`
                          : "Free"}
                    </span>
                    <span>
                      {upload && !upload.done && !upload.error ? (
                        <span className="status uploading">
                          ⬆ {upload.percent}%
                        </span>
                      ) : upload?.done ? (
                        <span className="status live">✓ Uploaded</span>
                      ) : upload?.error ? (
                        <span className="status" style={{ color: "#ff8a8a" }}>✗ Error</span>
                      ) : (
                        <span className={`status ${ep.video_status === "ready" ? "live" : ""}`}>
                          {ep.video_status ?? (isScheduled ? "scheduled" : "pending")}
                        </span>
                      )}
                    </span>
                    <span>
                      <button className="text-button" onClick={() => startEpisodeEdit(ep)}>Edit</button>
                      <button
                        className="text-button"
                        title="Select a video file above, then click Re-upload"
                        onClick={() => reUpload(ep)}
                        id={`reupload-${ep.id}`}
                      >
                        Re-upload
                      </button>
                      <button
                        className="text-button danger"
                        onClick={async () => {
                          if (!confirm(`Delete "${ep.title}"?`)) return;
                          await deleteEpisode(selectedSeriesId, String(ep.id));
                          toast.success("Episode deleted");
                          void loadEpisodes();
                        }}
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                );
              })}
              {!episodes.length && <p className="empty-state">No episodes yet — create one above.</p>}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
