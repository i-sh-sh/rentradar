import { useNavigate } from "react-router-dom";
import { useFilterStore } from "../stores/filterStore";
import { X } from "lucide-react";

export default function CompareBar() {
  const { compareIds, clearCompare } = useFilterStore();
  const navigate = useNavigate();

  if (compareIds.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white rounded-2xl shadow-xl px-6 py-3 flex items-center gap-4">
      <span className="text-sm font-medium">{compareIds.length} דירות נבחרו</span>
      <button
        onClick={() => navigate(`/compare?ids=${compareIds.join(",")}`)}
        disabled={compareIds.length < 2}
        className="bg-white text-blue-700 font-bold px-4 py-1.5 rounded-xl text-sm hover:bg-blue-50 disabled:opacity-50"
      >
        השווה
      </button>
      <button onClick={clearCompare} className="text-white/70 hover:text-white">
        <X size={18} />
      </button>
    </div>
  );
}
