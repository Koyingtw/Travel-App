import axios from 'axios';
import type {
  Trip,
  TripSummary,
  TripCreate,
  TripUpdate,
  BacklogPlace,
  ItineraryItem,
  BudgetItem,
  OptimizeRouteRequest,
  OptimizedRoute,
  SupportedCurrency,
  ExchangeRateResponse,
  APIResponse,
  PaginatedResponse,
  TripStatistics,
} from '../types';

// API base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ Trip API ============

export const tripApi = {
  // Get all trips
  getAll: async (page = 1, pageSize = 20, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search) params.append('search', search);
    
    const { data } = await api.get<PaginatedResponse<TripSummary>>(`/trips?${params}`);
    return data;
  },

  // Get single trip
  getById: async (tripId: string) => {
    const { data } = await api.get<Trip>(`/trips/${tripId}`);
    return data;
  },

  // Create new trip
  create: async (tripData: TripCreate) => {
    const { data } = await api.post<APIResponse<{ trip_id: string }>>('/trips', tripData);
    return data;
  },

  // Update trip
  update: async (tripId: string, updateData: TripUpdate) => {
    const { data } = await api.put<APIResponse>(`/trips/${tripId}`, updateData);
    return data;
  },

  // Delete trip
  delete: async (tripId: string) => {
    const { data } = await api.delete<APIResponse>(`/trips/${tripId}`);
    return data;
  },

  // Get trip statistics
  getStatistics: async (tripId: string) => {
    const { data } = await api.get<TripStatistics>(`/trips/${tripId}/statistics`);
    return data;
  },

  // Add backlog place
  addBacklogPlace: async (tripId: string, place: Omit<BacklogPlace, 'id'>) => {
    const { data } = await api.post<APIResponse<{ place_id: string }>>(
      `/trips/${tripId}/backlog`,
      place
    );
    return data;
  },

  // Remove backlog place
  removeBacklogPlace: async (tripId: string, placeId: string) => {
    const { data } = await api.delete<APIResponse>(`/trips/${tripId}/backlog/${placeId}`);
    return data;
  },

  // Add itinerary item
  addItineraryItem: async (tripId: string, date: string, item: Omit<ItineraryItem, 'id'>) => {
    const { data } = await api.post<APIResponse<{ item_id: string }>>(
      `/trips/${tripId}/itinerary/${date}/items`,
      item
    );
    return data;
  },

  // Update day itinerary (for reordering)
  updateDayItinerary: async (tripId: string, date: string, items: ItineraryItem[]) => {
    const { data } = await api.put<APIResponse>(
      `/trips/${tripId}/itinerary/${date}/items`,
      items
    );
    return data;
  },

  // Update daily notes
  updateDailyNotes: async (tripId: string, date: string, notes: string) => {
    const { data } = await api.put<APIResponse>(
      `/trips/${tripId}/itinerary/${date}/notes`,
      { content: notes }
    );
    return data;
  },

  // Add budget item
  addBudgetItem: async (tripId: string, date: string, budgetItem: Omit<BudgetItem, 'id'>) => {
    const { data } = await api.post<APIResponse<{ item_id: string }>>(
      `/trips/${tripId}/itinerary/${date}/budget`,
      budgetItem
    );
    return data;
  },
};

// ============ Route Optimization API ============

export const routeApi = {
  optimize: async (request: OptimizeRouteRequest) => {
    const { data } = await api.post<OptimizedRoute>('/optimize-route', request);
    return data;
  },
};

// ============ Exchange Rate API ============

export const exchangeApi = {
  getCurrencies: async () => {
    const { data } = await api.get<SupportedCurrency[]>('/exchange/currencies');
    return data;
  },

  getRates: async (baseCurrency = 'CAD') => {
    const { data } = await api.get<{ base: string; rates: Record<string, number> }>(
      `/exchange/rates?base=${baseCurrency}`
    );
    return data;
  },

  convert: async (amount: number, fromCurrency: string, toCurrency: string) => {
    const { data } = await api.post<ExchangeRateResponse>('/exchange/convert', {
      amount,
      from_currency: fromCurrency,
      to_currency: toCurrency,
    });
    return data;
  },

  quickConvert: async (amount: number, fromCurrency = 'CAD', toCurrency = 'TWD') => {
    const params = new URLSearchParams({
      amount: amount.toString(),
      from_currency: fromCurrency,
      to_currency: toCurrency,
    });
    const { data } = await api.get<{
      original: string;
      converted: string;
      rate: number;
    }>(`/exchange/quick-convert?${params}`);
    return data;
  },
};

export default api;
