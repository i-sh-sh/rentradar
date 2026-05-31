import { create } from "zustand";
import type { FilterParams } from "../api/apartments";

interface FilterStore {
  filters: FilterParams;
  compareIds: string[];
  setFilters: (f: Partial<FilterParams>) => void;
  resetFilters: () => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
}

const defaultFilters: FilterParams = {
  sort_by: "created_at",
  sort_dir: "desc",
  page: 1,
  page_size: 40,
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  compareIds: [],

  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f, page: 1 } })),

  resetFilters: () => set({ filters: defaultFilters }),

  toggleCompare: (id) =>
    set((s) => {
      if (s.compareIds.includes(id)) {
        return { compareIds: s.compareIds.filter((x) => x !== id) };
      }
      if (s.compareIds.length >= 4) return s;
      return { compareIds: [...s.compareIds, id] };
    }),

  clearCompare: () => set({ compareIds: [] }),
}));
