import { useFilterStore } from "../stores/filterStore";

const CITIES = [
  "תל אביב יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה",
  "אשדוד", "נתניה", "באר שבע", "בני ברק", "רמת גן",
  "הרצליה", "כפר סבא", "רחובות", "חולון", "בת ים", "מודיעין",
];

export default function FilterBar() {
  const { filters, setFilters, resetFilters } = useFilterStore();

  return (
    <div className="bg-white border-b px-4 py-3 flex flex-wrap gap-3 items-end sticky top-14 z-10">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">עיר</label>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={filters.city || ""}
          onChange={(e) => setFilters({ city: e.target.value || undefined })}
        >
          <option value="">כל הערים</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">שכונה</label>
        <input
          className="border rounded-lg px-3 py-1.5 text-sm w-36"
          placeholder="שם שכונה..."
          value={filters.neighborhood || ""}
          onChange={(e) => setFilters({ neighborhood: e.target.value || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">חדרים</label>
        <div className="flex items-center gap-1">
          <input
            type="number" min={1} max={10} step={0.5}
            className="border rounded-lg px-2 py-1.5 text-sm w-16"
            placeholder="מ-"
            value={filters.rooms_min ?? ""}
            onChange={(e) => setFilters({ rooms_min: e.target.value ? +e.target.value : undefined })}
          />
          <span className="text-gray-400">—</span>
          <input
            type="number" min={1} max={10} step={0.5}
            className="border rounded-lg px-2 py-1.5 text-sm w-16"
            placeholder="-עד"
            value={filters.rooms_max ?? ""}
            onChange={(e) => setFilters({ rooms_max: e.target.value ? +e.target.value : undefined })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">מחיר (₪)</label>
        <div className="flex items-center gap-1">
          <input
            type="number" min={0} step={500}
            className="border rounded-lg px-2 py-1.5 text-sm w-24"
            placeholder="מ-"
            value={filters.price_min ?? ""}
            onChange={(e) => setFilters({ price_min: e.target.value ? +e.target.value : undefined })}
          />
          <span className="text-gray-400">—</span>
          <input
            type="number" min={0} step={500}
            className="border rounded-lg px-2 py-1.5 text-sm w-24"
            placeholder="-עד"
            value={filters.price_max ?? ""}
            onChange={(e) => setFilters({ price_max: e.target.value ? +e.target.value : undefined })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">מ"ר</label>
        <div className="flex items-center gap-1">
          <input
            type="number" min={0}
            className="border rounded-lg px-2 py-1.5 text-sm w-16"
            placeholder="מ-"
            value={filters.size_min ?? ""}
            onChange={(e) => setFilters({ size_min: e.target.value ? +e.target.value : undefined })}
          />
          <span className="text-gray-400">—</span>
          <input
            type="number" min={0}
            className="border rounded-lg px-2 py-1.5 text-sm w-16"
            placeholder="-עד"
            value={filters.size_max ?? ""}
            onChange={(e) => setFilters({ size_max: e.target.value ? +e.target.value : undefined })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">מה</label>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={filters.agent_or_owner || ""}
          onChange={(e) => setFilters({ agent_or_owner: e.target.value || undefined })}
        >
          <option value="">הכל</option>
          <option value="owner">בעל דירה</option>
          <option value="agent">מתווך</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">מיון</label>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={`${filters.sort_by}_${filters.sort_dir}`}
          onChange={(e) => {
            const [sort_by, sort_dir] = e.target.value.split("_");
            setFilters({ sort_by, sort_dir });
          }}
        >
          <option value="created_at_desc">חדש ביותר</option>
          <option value="created_at_asc">ישן ביותר</option>
          <option value="price_nis_asc">מחיר: נמוך לגבוה</option>
          <option value="price_nis_desc">מחיר: גבוה לנמוך</option>
          <option value="rooms_asc">חדרים: מעט לרב</option>
          <option value="rooms_desc">חדרים: רב למעט</option>
        </select>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={!!filters.saved_only}
            onChange={(e) => setFilters({ saved_only: e.target.checked || undefined })}
          />
          שמורים בלבד
        </label>

        <button
          onClick={resetFilters}
          className="text-sm text-gray-400 hover:text-gray-700 underline"
        >
          נקה
        </button>
      </div>
    </div>
  );
}
