import { useState } from "react";
import { useScrapeJobs, useRunScrape } from "../api/apartments";
import { Play, Loader2, CheckCircle, XCircle, Clock, BookMarked, ExternalLink } from "lucide-react";

const CITIES = [
  "תל אביב יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה",
  "אשדוד", "נתניה", "באר שבע", "הרצליה", "רמת גן", "מודיעין",
];

export default function AdminPage() {
  const { data: jobs } = useScrapeJobs();
  const runScrape = useRunScrape();

  const [city, setCity] = useState("תל אביב יפו");
  const [neighborhood, setNeighborhood] = useState("");
  const [roomsMin, setRoomsMin] = useState("");
  const [roomsMax, setRoomsMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [maxPages, setMaxPages] = useState("5");

  function handleRun() {
    runScrape.mutate({
      city,
      neighborhood: neighborhood || undefined,
      rooms_min: roomsMin ? +roomsMin : undefined,
      rooms_max: roomsMax ? +roomsMax : undefined,
      price_min: priceMin ? +priceMin : undefined,
      price_max: priceMax ? +priceMax : undefined,
      max_pages: +maxPages,
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ייבוא מיד2</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
        <BookMarked className="text-blue-600 shrink-0 mt-1" size={24} />
        <div>
          <div className="font-semibold text-blue-800 mb-1">ייבוא ידני עם Bookmarklet (מומלץ)</div>
          <p className="text-sm text-blue-700 mb-3">
            יד2 חוסמים סריקה אוטומטית. הפתרון: גלוש ביד2 בדפדפן שלך ולחץ על סימנייה שמייבאת את הדירות ישירות.
          </p>
          <a
            href="http://localhost:8000/scraper/bookmarklet"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            <ExternalLink size={14} />
            הוראות + התקנת ה-Bookmarklet
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4 text-gray-700">פרמטרי סריקה</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">עיר</label>
            <select className="border rounded-lg px-3 py-2 w-full text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">שכונה (אופציונלי)</label>
            <input className="border rounded-lg px-3 py-2 w-full text-sm" placeholder="שם שכונה..." value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">חדרים מינ׳</label>
            <input type="number" step={0.5} className="border rounded-lg px-3 py-2 w-full text-sm" placeholder="2" value={roomsMin} onChange={(e) => setRoomsMin(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">חדרים מקס׳</label>
            <input type="number" step={0.5} className="border rounded-lg px-3 py-2 w-full text-sm" placeholder="4" value={roomsMax} onChange={(e) => setRoomsMax(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">מחיר מינ׳ (₪)</label>
            <input type="number" step={500} className="border rounded-lg px-3 py-2 w-full text-sm" placeholder="3000" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">מחיר מקס׳ (₪)</label>
            <input type="number" step={500} className="border rounded-lg px-3 py-2 w-full text-sm" placeholder="8000" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">מקסימום עמודים</label>
            <input type="number" min={1} max={20} className="border rounded-lg px-3 py-2 w-full text-sm" value={maxPages} onChange={(e) => setMaxPages(e.target.value)} />
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={runScrape.isPending}
          className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {runScrape.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          הפעל סריקה
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold mb-4 text-gray-700">היסטוריית עבודות</h2>
        {!jobs?.length ? (
          <div className="text-gray-400 text-sm text-center py-8">עדיין לא הורצה סריקה</div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3 text-sm border rounded-xl px-4 py-3">
                {job.status === "running" && <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />}
                {job.status === "done" && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                {job.status === "failed" && <XCircle size={16} className="text-red-500 shrink-0" />}

                <div className="flex-1">
                  <div className="font-medium">
                    {(job.search_params as Record<string, unknown>)?.city as string} — {job.status === "running" ? "מריץ..." : job.status === "done" ? `${job.listings_found} דירות` : "נכשל"}
                  </div>
                  {job.error && <div className="text-red-500 text-xs mt-0.5">{job.error}</div>}
                </div>

                <div className="text-gray-400 flex items-center gap-1 shrink-0">
                  <Clock size={12} />
                  {new Date(job.started_at).toLocaleString("he-IL")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
