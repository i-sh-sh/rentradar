import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useApartments } from "../api/apartments";
import { formatNIS, formatRooms } from "../lib/formatters";
import L from "leaflet";

// Fix default marker icons for Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapPage() {
  const navigate = useNavigate();
  const { data } = useApartments({ page_size: 200, sort_by: "created_at", sort_dir: "desc" });

  const withCoords = (data?.items || []).filter((a) => a.lat && a.lng);

  return (
    <div style={{ height: "calc(100vh - 56px)" }}>
      <MapContainer center={[32.08, 34.78]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((apt) => (
          <Marker key={apt.id} position={[apt.lat!, apt.lng!]}>
            <Popup>
              <div className="text-right" style={{ direction: "rtl", minWidth: 160 }}>
                <div className="font-bold text-blue-700">{formatNIS(apt.price_nis)}</div>
                <div className="text-sm">{formatRooms(apt.rooms)} · {apt.neighborhood}</div>
                <button
                  onClick={() => navigate(`/apartment/${apt.id}`)}
                  className="mt-1 text-xs text-blue-600 underline"
                >
                  פרטים
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
