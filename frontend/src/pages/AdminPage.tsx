import { useState } from "react";
import { useScrapeJobs } from "../api/apartments";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, Clock, BookMarked, ExternalLink, Clipboard } from "lucide-react";
import { api } from "../api/client";

export default function AdminPage() {
  const { data: jobs } = useScrapeJobs();
  const [pasteResult, setPasteResult] = useState<string | null>(null);

  const pasteImport = useMutation({
    mutationFn: async () => {
      const text = await navigator.clipboard.readText();
      const payload = JSON.parse(text);
      const res = await api.post("/scraper/import", payload);
      return res.data as { imported: number };
    },
    onSuccess: (data) => {
      setPasteResult(`✅ יובאו ${data.imported} דירות בהצלחה!`);
    },
    onError: (e: Error) => {
      setPasteResult(`❌ שגיאה: ${e.message}`);
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ייבוא מיד2</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
        <BookMarked className="text-blue-600 shrink-0 mt-1" size={24} />
        <div className="flex-1">
          <div className="font-semibold text-blue-800 mb-1">ייבוא ידני עם Bookmarklet (מומלץ)</div>
          <p className="text-sm text-blue-700 mb-3">
            יד2 חוסמים סריקה אוטומטית. הפתרון: גלוש ביד2 בדפדפן שלך, לחץ על הסימנייה — הנתונים יועתקו — ואז לחץ "הדבק וייבא" כאן.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="http://localhost:8000/scraper/bookmarklet"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              <ExternalLink size={14} />
              הוראות + התקנת ה-Bookmarklet
            </a>
            <button
              onClick={() => { setPasteResult(null); pasteImport.mutate(); }}
              disabled={pasteImport.isPending}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {pasteImport.isPending ? <Loader2 size={14} className="animate-spin" /> : <Clipboard size={14} />}
              הדבק וייבא
            </button>
          </div>
          {pasteResult && (
            <div className={`mt-3 text-sm font-medium ${pasteResult.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
              {pasteResult}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold mb-4 text-gray-700">היסטוריית ייבוא</h2>
        {!jobs?.length ? (
          <div className="text-gray-400 text-sm text-center py-8">עדיין לא בוצע ייבוא</div>
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
