// ============ Place / Location Types ============

export type PlaceCategory = 
  | 'nature'
  | 'museum'
  | 'restaurant'
  | 'hotel'
  | 'shopping'
  | 'entertainment'
  | 'landmark'
  | 'transportation'
  | 'other';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BacklogPlace {
  id: string;
  name: string;
  address?: string;
  coordinates?: Coordinates;
  duration: number; // minutes
  category: PlaceCategory;
  notes?: string;
  image_url?: string;
  rating?: number;
  priority: number;
}

// ============ Itinerary Types ============

export interface ItineraryItem {
  id: string;
  time: string; // HH:MM
  end_time?: string;
  place_name: string;
  address?: string;
  coordinates?: Coordinates;
  duration: number;
  notes?: string;
  category: PlaceCategory;
  completed: boolean;
  order: number;
  is_custom?: boolean; // 自訂活動標記（如交通、休息等）
}

export interface BudgetItem {
  id: string;
  item: string;
  cost: number;
  currency: string;
  category: string;
  paid: boolean;
  payment_method?: string;
  receipt_url?: string;
}

export interface DayItinerary {
  date: string; // YYYY-MM-DD
  items: ItineraryItem[];
  daily_notes: string;
  budget_items: BudgetItem[];
  accommodation?: ItineraryItem; // 每日住宿
  weather?: {
    temp?: number;
    condition?: string;
    icon?: string;
  };
}

// ============ Trip Types ============

export interface Trip {
  _id: string;
  title: string;
  description?: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image?: string;
  tags: string[];
  backlog_places: BacklogPlace[];
  itinerary: DayItinerary[];
  total_budget: number;
  user_id?: string;
  created_at: string;
  updated_at: string;
  is_protected?: boolean; // 是否受密碼保護
}

export interface TripSummary {
  _id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image?: string;
  total_places: number;
  total_days: number;
}

export interface TripCreate {
  title: string;
  description?: string;
  destination?: string;
  start_date: string;
  end_date: string;
  cover_image?: string;
  tags?: string[];
  backlog_places?: Omit<BacklogPlace, 'id'>[];
}

export interface TripUpdate {
  title?: string;
  description?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  cover_image?: string;
  tags?: string[];
  backlog_places?: BacklogPlace[];
  itinerary?: DayItinerary[];
}

// ============ Route Optimization Types ============

export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface OptimizeRouteRequest {
  points: RoutePoint[];
  start_point_id?: string;
  end_point_id?: string;
  optimize_for?: 'distance' | 'time';
}

export interface OptimizedRoute {
  ordered_points: RoutePoint[];
  total_distance_km: number;
  estimated_duration_minutes: number;
  polyline?: string;
}

// ============ Exchange Rate Types ============

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface ExchangeRateResponse {
  original_amount: number;
  converted_amount: number;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  last_updated: string;
}

// ============ API Response Types ============

export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============ UI Types ============

export interface DragItem {
  id: string;
  type: 'backlog' | 'itinerary';
  data: BacklogPlace | ItineraryItem;
}

export interface TripStatistics {
  total_days: number;
  total_backlog_places: number;
  total_planned_activities: number;
  total_budget: number;
  activities_by_category: Record<string, number>;
}
