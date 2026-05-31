import { useFilterStore } from "../stores/filterStore";
import { useApartments } from "../api/apartments";
import FilterBar from "../components/FilterBar";
import ApartmentCard from "../components/ApartmentCard";
import CompareBar from "../components/CompareBar";
import { Loader2 } from "lucide-react";

export default function ListingsPage() {
  const { filters, setFilters } = useFilterStore();
  const { data, isLoading, isError } = useApartments(filters);

  const totalPages = data ? Math.ceil(data.total / (filters.page_size || 40)) : 1;

  return (
    <div>
      <FilterBar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-red-500">שגיאה בטעינת הדירות. האם ה-backend פועל?</div>
        )}

        {data && (
          <>
            <div className="text-sm text-gray-500 mb-4">
              {data.total.toLocaleString("he-IL")} דירות נמצאו
            </div>

            {data.items.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🔍</div>
                <div>לא נמצאו דירות עם הפילטרים האלה</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.items.map((apt) => (
                  <ApartmentCard key={apt.id} apt={apt} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters({ page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40"
                >
                  הקודם
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  עמוד {filters.page || 1} מתוך {totalPages}
                </span>
                <button
                  onClick={() => setFilters({ page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= totalPages}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40"
                >
                  הבא
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CompareBar />
    </div>
  );
}
