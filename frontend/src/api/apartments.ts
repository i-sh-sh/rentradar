import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export interface Apartment {
  id: string;
  yad2_id?: string;
  source: string;
  url?: string;
  title?: string;
  description?: string;
  price_nis?: number;
  rooms?: number;
  floor?: number;
  total_floors?: number;
  size_sqm?: number;
  city?: string;
  neighborhood?: string;
  street?: string;
  lat?: number;
  lng?: number;
  features?: Record<string, boolean>;
  images?: string[];
  entry_date?: string;
  agent_or_owner?: string;
  created_at: string;
  is_active: boolean;
  price_per_sqm?: number;
  price_history?: { id: string; price_nis: number; recorded_at: string }[];
  saved?: { id: string; notes?: string; tags?: string[]; rating?: number; saved_at: string } | null;
}

export interface ApartmentListResponse {
  items: Apartment[];
  total: number;
  page: number;
  page_size: number;
}

export interface FilterParams {
  city?: string;
  neighborhood?: string;
  rooms_min?: number;
  rooms_max?: number;
  price_min?: number;
  price_max?: number;
  size_min?: number;
  size_max?: number;
  agent_or_owner?: string;
  saved_only?: boolean;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}

export function useApartments(params: FilterParams) {
  return useQuery({
    queryKey: ["apartments", params],
    queryFn: async () => {
      const { data } = await api.get<ApartmentListResponse>("/apartments", { params });
      return data;
    },
  });
}

export function useApartment(id: string) {
  return useQuery({
    queryKey: ["apartment", id],
    queryFn: async () => {
      const { data } = await api.get<Apartment>(`/apartments/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCompare(ids: string[]) {
  return useQuery({
    queryKey: ["compare", ids],
    queryFn: async () => {
      const { data } = await api.get<Apartment[]>("/apartments/compare", {
        params: { ids: ids.join(",") },
      });
      return data;
    },
    enabled: ids.length >= 2,
  });
}

export function useSaveApartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes, tags, rating }: { id: string; notes?: string; tags?: string[]; rating?: number }) => {
      const { data } = await api.post(`/saved/${id}`, { notes, tags, rating });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apartments"] }),
  });
}

export function useUnsaveApartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/saved/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apartments"] }),
  });
}

export interface ScrapeJob {
  id: string;
  status: string;
  search_params?: Record<string, unknown>;
  listings_found?: number;
  started_at: string;
  finished_at?: string;
  error?: string;
}

export function useScrapeJobs() {
  return useQuery({
    queryKey: ["scrape-jobs"],
    queryFn: async () => {
      const { data } = await api.get<ScrapeJob[]>("/scraper/jobs");
      return data;
    },
    refetchInterval: 5000,
  });
}

export function useRunScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const { data } = await api.post<ScrapeJob>("/scraper/run", params);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["apartments"] });
    },
  });
}
