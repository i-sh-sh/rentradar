import { useSearchParams, useNavigate } from "react-router-dom";
import { useCompare } from "../api/apartments";
import { formatNIS, formatRooms, formatSqm, formatFloor, formatPricePerSqm, agentLabel } from "../lib/formatters";
import { ArrowRight } from "lucide-react";

type FeatureKey = "parking" | "elevator" | "balcony" | "mamad" | "ac" | "storage" | "renovated" | "furnished" | "pets";

const FEATURE_LABELS: Record<FeatureKey, string> = {
  parking: "חנייה",
  elevator: "מעלית",
  balcony: "מרפסת",
  mamad: 'ממ"ד',
  ac: "מזגן",
  storage: "מחסן",
  renovated: "משופצת",
  furnished: "מרוהטת",
  pets: 'בע"ח',
};

export default function ComparePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ids = (params.get("ids") || "").split(",").filter(Boolean);
  const { data: apartments, isLoading } = useCompare(ids);

  if (ids.length < 2) return (
    <div className="text-center py-20 text-gray-400">יש לבחור לפחות 2 דירות להשוואה</div>
  );

  if (isLoading) return <div className="text-center py-20 text-gray-400">טוען...</div>;
  if (!apartments?.length) return <div className="text-center py-20 text-red-500">שגיאה בטעינת הדירות</div>;

  const cols = apartments.length;
  const gridCols = `repeat(${cols + 1}, minmax(0, 1fr))`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-4 text-sm">
        <ArrowRight size={16} />
        חזרה
      </button>

      <h1 className="text-2xl font-bold mb-6">השוואת דירות</h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-right text-gray-500 font-medium w-32">קריטריון</th>
                {apartments.map((apt) => (
                  <th key={apt.id} className="px-4 py-3 text-center">
                    <div
                      className="font-semibold text-blue-700 cursor-pointer hover:underline"
                      onClick={() => navigate(`/apartment/${apt.id}`)}
                    >
                      {apt.city} — {apt.neighborhood || apt.street || ""}
                    </div>
                    {apt.images?.[0] && (
                      <img src={apt.images[0]} alt="" className="w-full h-24 object-cover rounded-lg mt-2" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="מחיר" values={apartments.map((a) => formatNIS(a.price_nis))} highlight="min" numericValues={apartments.map((a) => a.price_nis)} />
              <Row label='מחיר למ"ר' values={apartments.map((a) => formatPricePerSqm(a.price_per_sqm))} highlight="min" numericValues={apartments.map((a) => a.price_per_sqm)} />
              <Row label="חדרים" values={apartments.map((a) => formatRooms(a.rooms))} />
              <Row label='מ"ר' values={apartments.map((a) => formatSqm(a.size_sqm))} highlight="max" numericValues={apartments.map((a) => a.size_sqm)} />
              <Row label="קומה" values={apartments.map((a) => formatFloor(a.floor, a.total_floors))} />
              <Row label="עיר" values={apartments.map((a) => a.city || "—")} />
              <Row label="שכונה" values={apartments.map((a) => a.neighborhood || "—")} />
              <Row label="מוכר" values={apartments.map((a) => agentLabel(a.agent_or_owner))} />
              {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((feat) => (
                <FeatureRow key={feat} label={FEATURE_LABELS[feat]} feature={feat} apartments={apartments} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  values,
  highlight,
  numericValues,
}: {
  label: string;
  values: string[];
  highlight?: "min" | "max";
  numericValues?: (number | null | undefined)[];
}) {
  const nums = numericValues?.map((v) => v ?? Infinity) || [];
  const best = highlight === "min" ? Math.min(...nums) : highlight === "max" ? Math.max(...nums) : null;

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-gray-500 font-medium">{label}</td>
      {values.map((v, i) => {
        const isBest = best !== null && numericValues?.[i] != null && numericValues[i] === best;
        return (
          <td key={i} className={`px-4 py-3 text-center font-medium ${isBest ? "text-green-600 bg-green-50" : ""}`}>
            {v}
          </td>
        );
      })}
    </tr>
  );
}

function FeatureRow({ label, feature, apartments }: { label: string; feature: FeatureKey; apartments: ReturnType<typeof useCompare>["data"] & object[] }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-gray-500 font-medium">{label}</td>
      {apartments.map((apt) => (
        <td key={apt.id} className="px-4 py-3 text-center">
          {apt.features?.[feature] ? "✅" : "❌"}
        </td>
      ))}
    </tr>
  );
}
