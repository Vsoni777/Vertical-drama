import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSeries } from "../api/series";
import type { Series } from "../types/Series";

const coverClasses = ["cover-rose", "cover-red", "cover-sunset", "cover-violet"];
export const seriesCoverClass = (series: Series) => series.coverClass || coverClasses[series.id % coverClasses.length];
const titleOf = (series: Series) => series.title || "Untitled series";

export default function SeriesList() {
  const [query, setQuery] = useState(""); const [series, setSeries] = useState<Series[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active = true; getSeries().then((items) => { if (active) setSeries(items); }).catch(() => { if (active) setError("We couldn't load the catalogue. Make sure the Rails API is running and CORS is configured."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const items = useMemo(() => series.filter((item) => `${item.title} ${item.genre || ""}`.toLowerCase().includes(query.toLowerCase())), [query, series]);
  return <main className="content-page"><section className="page-heading"><div><p className="eyebrow">EXPLORE SHORT-FORM STORIES</p><h1>Find your next obsession</h1></div><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dramas, genres..." /></label></section><section className="series-grid">{items.map((item) => <Link className={`series-card ${seriesCoverClass(item)}`} style={item.cover_url || item.thumbnail_url ? { backgroundImage: `linear-gradient(#160d2133, #160d21cc), url(${item.cover_url || item.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} to={`/series/${item.id}`} key={item.id}><div className="series-card-top"><span>{item.status || "Published"}</span><span>{item.episodeCount || item.episodes?.length || 0} eps</span></div><div><p>{item.genre || "Drama"}</p><h2>{titleOf(item)}</h2><span className="watch-now">Watch now <b>→</b></span></div></Link>)}</section>{loading && <p className="empty-state">Loading series…</p>}{error && <p className="error-state">{error}</p>}{!loading && !error && !items.length && <p className="empty-state">No published series found.</p>}</main>;
}
