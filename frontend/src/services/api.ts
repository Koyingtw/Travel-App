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
  Member,
  SettleUpExpense,
  ExpensesDashboard,
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

  getRates: async (baseCurrency = 'USD') => {
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

  quickConvert: async (amount: number, fromCurrency = 'USD', toCurrency = 'TWD') => {
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

// ============ Expenses & Settle Up API ============

export const expenseApi = {
  // Get dashboard (expenses, balances, settlements)
  getDashboard: async (tripId: string) => {
    const { data } = await api.get<ExpensesDashboard>(`/trips/${tripId}/expenses`);
    return data;
  },

  // Add member
  addMember: async (tripId: string, name: string) => {
    const { data } = await api.post<APIResponse<{ member: Member }>>(
      `/trips/${tripId}/expenses/members`,
      { name }
    );
    return data;
  },

  // Rename member
  updateMember: async (tripId: string, memberId: string, name: string) => {
    const { data } = await api.put<APIResponse>(
      `/trips/${tripId}/expenses/members/${memberId}`,
      { name }
    );
    return data;
  },

  // Delete member
  deleteMember: async (tripId: string, memberId: string) => {
    const { data } = await api.delete<APIResponse>(
      `/trips/${tripId}/expenses/members/${memberId}`
    );
    return data;
  },

  // Add expense / settlement
  addExpense: async (tripId: string, expense: SettleUpExpense) => {
    const { data } = await api.post<APIResponse<{ expense_id: string }>>(
      `/trips/${tripId}/expenses`,
      expense
    );
    return data;
  },

  // Update expense
  updateExpense: async (tripId: string, expenseId: string, expense: SettleUpExpense) => {
    const { data } = await api.put<APIResponse>(
      `/trips/${tripId}/expenses/${expenseId}`,
      expense
    );
    return data;
  },

  // Delete expense
  deleteExpense: async (tripId: string, expenseId: string) => {
    const { data } = await api.delete<APIResponse>(
      `/trips/${tripId}/expenses/${expenseId}`
    );
    return data;
  },

  // OCR Receipt Scan
  scanReceipt: async (tripId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{
      success: boolean;
      description: string;
      amount: number;
      currency: string;
      date: string;
      category: string;
      is_mock: boolean;
    }>(`/trips/${tripId}/expenses/scan-receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Export Excel Download URL
  getExportUrl: (tripId: string) => {
    return `/api/trips/${tripId}/expenses/export`;
  },
};

export default api;
