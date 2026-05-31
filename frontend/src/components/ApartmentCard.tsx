import { Heart, MapPin, Layers, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Apartment } from "../api/apartments";
import { useSaveApartment, useUnsaveApartment } from "../api/apartments";
import { useFilterStore } from "../stores/filterStore";
import { formatNIS, formatRooms, formatSqm, formatFloor, formatPricePerSqm } from "../lib/formatters";
import clsx from "clsx";

export default function ApartmentCard({ apt }: { apt: Apartment }) {
  const navigate = useNavigate();
  const { compareIds, toggleCompare } = useFilterStore();
  const save = useSaveApartment();
  const unsave = useUnsaveApartment();

  const isSaved = !!apt.saved;
  const isComparing = compareIds.includes(apt.id);
  const img = apt.images?.[0];

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (isSaved) unsave.mutate(apt.id);
    else save.mutate({ id: apt.id });
  }

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow flex flex-col overflow-hidden",
        isComparing && "ring-2 ring-blue-500"
      )}
      onClick={() => navigate(`/apartment/${apt.id}`)}
    >
      <div className="relative">
        {img ? (
          <img src={img} alt={apt.title || "דירה"} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">🏠</div>
        )}

        <button
          onClick={handleSave}
          className={clsx(
            "absolute top-2 left-2 p-2 rounded-full shadow transition-colors",
            isSaved ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-400"
          )}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); toggleCompare(apt.id); }}
          className={clsx(
            "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium shadow transition-colors",
            isComparing ? "bg-blue-500 text-white" : "bg-white text-gray-500 hover:bg-blue-50"
          )}
        >
          השוואה
        </button>

        {apt.agent_or_owner === "owner" && (
          <span className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            בעל דירה
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-lg text-blue-700">{formatNIS(apt.price_nis)}</div>
          {apt.price_per_sqm && (
            <div className="text-xs text-gray-400">{formatPricePerSqm(apt.price_per_sqm)}</div>
          )}
        </div>

        <div className="flex gap-3 text-sm text-gray-600 flex-wrap">
          <span className="flex items-center gap-1">
            <Layers size={13} /> {formatRooms(apt.rooms)}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 size={13} /> {formatSqm(apt.size_sqm)}
          </span>
          <span>{formatFloor(apt.floor, apt.total_floors)}</span>
        </div>

        {(apt.city || apt.neighborhood) && (
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin size={12} />
            {[apt.neighborhood, apt.city].filter(Boolean).join(", ")}
          </div>
        )}

        {apt.features && (
          <div className="flex gap-1 flex-wrap mt-1">
            {apt.features.parking && <Tag>חנייה</Tag>}
            {apt.features.elevator && <Tag>מעלית</Tag>}
            {apt.features.balcony && <Tag>מרפסת</Tag>}
            {apt.features.mamad && <Tag>ממ"ד</Tag>}
            {apt.features.ac && <Tag>מזגן</Tag>}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{children}</span>
  );
}
