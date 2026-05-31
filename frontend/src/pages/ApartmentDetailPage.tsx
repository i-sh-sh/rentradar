import { useParams, useNavigate } from "react-router-dom";
import { useApartment, useSaveApartment, useUnsaveApartment } from "../api/apartments";
import { formatNIS, formatRooms, formatSqm, formatFloor, formatPricePerSqm, agentLabel } from "../lib/formatters";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Heart, ArrowRight, ExternalLink, Phone } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: apt, isLoading } = useApartment(id!);
  const save = useSaveApartment();
  const unsave = useUnsaveApartment();
  const [imgIdx, setImgIdx] = useState(0);
  const [note, setNote] = useState("");

  if (isLoading) return <div className="flex justify-center py-20 text-gray-400">טוען...</div>;
  if (!apt) return <div className="text-center py-20 text-red-500">דירה לא נמצאה</div>;

  const isSaved = !!apt.saved;
  const imgs = apt.images || [];

  const priceChartData = apt.price_history?.map((ph) => ({
    date: new Date(ph.recorded_at).toLocaleDateString("he-IL"),
    price: ph.price_nis,
  })) || [];

  function handleSave() {
    if (isSaved) unsave.mutate(apt!.id);
    else save.mutate({ id: apt!.id, notes: note || undefined });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-4 text-sm">
        <ArrowRight size={16} />
        חזרה
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {imgs.length > 0 ? (
          <div className="relative">
            <img src={imgs[imgIdx]} alt="דירה" className="w-full h-72 object-cover" />
            {imgs.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {imgs.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={clsx("w-2 h-2 rounded-full transition-colors", i === imgIdx ? "bg-white" : "bg-white/50")}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-6xl">🏠</div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-700 mb-1">{formatNIS(apt.price_nis)}</h1>
              {apt.price_per_sqm && <div className="text-sm text-gray-400">{formatPricePerSqm(apt.price_per_sqm)}</div>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={clsx(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-colors",
                  isSaved ? "bg-red-50 text-red-600 border border-red-200" : "bg-gray-50 text-gray-600 border hover:bg-red-50 hover:text-red-500"
                )}
              >
                <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "מסומן" : "שמור"}
              </button>
              {apt.url && (
                <a href={apt.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                  <ExternalLink size={14} />
                  יד2
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Stat label="חדרים" value={formatRooms(apt.rooms)} />
            <Stat label='מ"ר' value={formatSqm(apt.size_sqm)} />
            <Stat label="קומה" value={formatFloor(apt.floor, apt.total_floors)} />
            <Stat label="מוכר" value={agentLabel(apt.agent_or_owner)} />
          </div>

          {(apt.city || apt.neighborhood || apt.street) && (
            <div className="text-gray-600 mb-4 text-sm">
              📍 {[apt.street, apt.neighborhood, apt.city].filter(Boolean).join(", ")}
            </div>
          )}

          {apt.contact_phone && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
              <Phone size={14} />
              <a href={`tel:${apt.contact_phone}`} className="text-blue-600 hover:underline">{apt.contact_phone}</a>
            </div>
          )}

          {apt.features && Object.values(apt.features).some(Boolean) && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2 text-gray-700">מאפיינים</h2>
              <div className="flex flex-wrap gap-2">
                {apt.features.parking && <Feature>חנייה</Feature>}
                {apt.features.elevator && <Feature>מעלית</Feature>}
                {apt.features.balcony && <Feature>מרפסת</Feature>}
                {apt.features.mamad && <Feature>ממ"ד</Feature>}
                {apt.features.ac && <Feature>מזגן</Feature>}
                {apt.features.storage && <Feature>מחסן</Feature>}
                {apt.features.renovated && <Feature>משופצת</Feature>}
                {apt.features.furnished && <Feature>מרוהטת</Feature>}
                {apt.features.pets && <Feature>מותר בע"ח</Feature>}
              </div>
            </div>
          )}

          {apt.description && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2 text-gray-700">תיאור</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{apt.description}</p>
            </div>
          )}

          {priceChartData.length > 1 && (
            <div className="mb-6">
              <h2 className="font-semibold mb-3 text-gray-700">היסטוריית מחיר</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={priceChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatNIS(v)} />
                  <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {isSaved && (
            <div>
              <h2 className="font-semibold mb-2 text-gray-700">הערות שלי</h2>
              <textarea
                className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="הוסף הערות אישיות..."
                defaultValue={apt.saved?.notes || ""}
                onBlur={(e) => save.mutate({ id: apt.id, notes: e.target.value, tags: apt.saved?.tags, rating: apt.saved?.rating })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">{children}</span>
  );
}
