"""
Pydantic Models for Maple Planner API
"""
from pydantic import BaseModel, Field, computed_field
from typing import List, Optional
from datetime import date, datetime
from enum import Enum


# ============ Place / Location Models ============

class PlaceCategory(str, Enum):
    """Categories for places/attractions."""
    NATURE = "nature"
    MUSEUM = "museum"
    RESTAURANT = "restaurant"
    HOTEL = "hotel"
    SHOPPING = "shopping"
    ENTERTAINMENT = "entertainment"
    LANDMARK = "landmark"
    TRANSPORTATION = "transportation"
    OTHER = "other"


class Coordinates(BaseModel):
    """Geographic coordinates."""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")


class PlaceGroup(BaseModel):
    """A group for organizing backlog places."""
    id: Optional[str] = Field(default=None, description="Unique identifier")
    name: str = Field(..., min_length=1, max_length=100, description="Group name")
    color: Optional[str] = Field(default="#6366f1", description="Hex color code")
    description: Optional[str] = Field(default=None, max_length=500, description="Group description")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")


class BacklogPlace(BaseModel):
    """A place in the backlog (candidate list)."""
    id: Optional[str] = Field(default=None, description="Unique identifier")
    name: str = Field(..., min_length=1, max_length=200, description="Place name")
    address: Optional[str] = Field(default=None, max_length=500, description="Address")
    coordinates: Optional[Coordinates] = Field(default=None, description="GPS coordinates")
    duration: int = Field(default=60, ge=15, le=1440, description="Estimated stay duration in minutes")
    category: PlaceCategory = Field(default=PlaceCategory.OTHER, description="Place category")
    notes: Optional[str] = Field(default=None, max_length=2000, description="Additional notes")
    image_url: Optional[str] = Field(default=None, description="Image URL")
    rating: Optional[float] = Field(default=None, ge=0, le=5, description="Rating (0-5)")
    priority: int = Field(default=0, ge=0, le=5, description="Priority level (0-5)")
    group_id: Optional[str] = Field(default=None, description="Group ID for organizing places")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")


class BacklogPlaceCreate(BaseModel):
    """Schema for creating a new backlog place."""
    name: str = Field(..., min_length=1, max_length=200)
    address: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    duration: int = Field(default=60, ge=15, le=1440)
    category: PlaceCategory = PlaceCategory.OTHER
    notes: Optional[str] = None
    image_url: Optional[str] = None
    rating: Optional[float] = None
    priority: int = Field(default=0, ge=0, le=5)


# ============ Itinerary Models ============

class ItineraryItem(BaseModel):
    """A single item in the daily itinerary."""
    id: Optional[str] = Field(default=None, description="Unique identifier")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="Start time (HH:MM)")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$", description="End time (HH:MM)")
    place_name: str = Field(..., min_length=1, max_length=200, description="Place name")
    address: Optional[str] = Field(default=None, description="Address")
    coordinates: Optional[Coordinates] = Field(default=None, description="GPS coordinates")
    duration: int = Field(default=60, ge=15, description="Duration in minutes")
    notes: Optional[str] = Field(default=None, max_length=1000, description="Activity notes")
    category: PlaceCategory = Field(default=PlaceCategory.OTHER)
    completed: bool = Field(default=False, description="Whether the activity is completed")
    order: int = Field(default=0, description="Order in the day's itinerary")


class BudgetItem(BaseModel):
    """A budget/expense item."""
    id: Optional[str] = Field(default=None, description="Unique identifier")
    item: str = Field(..., min_length=1, max_length=200, description="Expense description")
    cost: float = Field(..., ge=0, description="Cost amount")
    currency: str = Field(default="CAD", max_length=3, description="Currency code")
    category: str = Field(default="other", description="Expense category")
    paid: bool = Field(default=False, description="Whether the expense is paid")
    payment_method: Optional[str] = Field(default=None, description="Payment method")
    receipt_url: Optional[str] = Field(default=None, description="Receipt image URL")


class DayItinerary(BaseModel):
    """A single day's itinerary."""
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date (YYYY-MM-DD)")
    items: List[ItineraryItem] = Field(default_factory=list, description="Itinerary items")
    daily_notes: Optional[str] = Field(default=None, max_length=5000, description="Rich text notes")
    budget_items: List[BudgetItem] = Field(default_factory=list, description="Budget items")
    weather: Optional[dict] = Field(default=None, description="Weather forecast data")


# ============ Trip Models ============

class TripBase(BaseModel):
    """Base trip model."""
    title: str = Field(..., min_length=1, max_length=200, description="Trip title")
    description: Optional[str] = Field(default=None, max_length=2000, description="Trip description")
    destination: str = Field(default="Canada", description="Main destination")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date")
    cover_image: Optional[str] = Field(default=None, description="Cover image URL")
    tags: List[str] = Field(default_factory=list, description="Trip tags")
    password_hash: Optional[str] = Field(default=None, description="Hashed password for edit protection")


class TripCreate(TripBase):
    """Schema for creating a new trip."""
    backlog_places: List[BacklogPlaceCreate] = Field(default_factory=list)


class TripUpdate(BaseModel):
    """Schema for updating a trip."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    backlog_places: Optional[List[BacklogPlace]] = None
    place_groups: Optional[List[PlaceGroup]] = None
    itinerary: Optional[List[DayItinerary]] = None


class Trip(TripBase):
    """Full trip model with ID and metadata."""
    id: str = Field(..., alias="_id", description="Trip ID")
    user_id: Optional[str] = Field(default=None, description="User ID (for future auth)")
    backlog_places: List[BacklogPlace] = Field(default_factory=list)
    place_groups: List[PlaceGroup] = Field(default_factory=list, description="Groups for organizing places")
    itinerary: List[DayItinerary] = Field(default_factory=list)
    total_budget: float = Field(default=0, description="Total estimated budget")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @computed_field
    @property
    def is_protected(self) -> bool:
        """Check if trip has password protection."""
        return bool(self.password_hash)
    
    class Config:
        populate_by_name = True
        # Ensure computed fields are included in serialization
        from_attributes = True

    def model_dump(self, **kwargs):
        """Override to exclude password_hash from API responses and use _id alias."""
        # Force by_alias=True to output _id instead of id
        kwargs.setdefault('by_alias', True)
        data = super().model_dump(**kwargs)
        data.pop('password_hash', None)  # Remove password_hash from response
        return data
    
    def model_dump_json(self, **kwargs):
        """Override to exclude password_hash from JSON responses."""
        # First dump to dict, remove password_hash, then convert to JSON
        import json
        data = self.model_dump(**kwargs)
        return json.dumps(data, default=str)


class TripSummary(BaseModel):
    """Trip summary for list views."""
    id: str = Field(..., alias="_id")
    title: str
    destination: str
    start_date: str
    end_date: str
    cover_image: Optional[str] = None
    total_places: int = 0
    total_days: int = 0
    
    class Config:
        populate_by_name = True


# ============ Route Optimization Models ============

class RoutePoint(BaseModel):
    """A point for route optimization."""
    id: str
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class TravelMode(str, Enum):
    """Travel modes for route optimization."""
    DRIVING = "driving"
    WALKING = "walking"
    TRANSIT = "transit"
    BICYCLING = "bicycling"


class OptimizeRouteRequest(BaseModel):
    """Request for route optimization."""
    points: List[RoutePoint] = Field(..., min_length=2, description="Points to optimize")
    start_point_id: Optional[str] = Field(default=None, description="Fixed starting point ID")
    end_point_id: Optional[str] = Field(default=None, description="Fixed ending point ID")
    optimize_for: str = Field(default="distance", description="Optimize for: distance or time")
    travel_mode: TravelMode = Field(default=TravelMode.DRIVING, description="Travel mode for optimization")


class OptimizedRoute(BaseModel):
    """Response with optimized route."""
    ordered_points: List[RoutePoint]
    total_distance_km: float
    estimated_duration_minutes: int
    polyline: Optional[str] = None  # Encoded polyline for map display


# ============ Exchange Rate Models ============

class ExchangeRateRequest(BaseModel):
    """Request for currency conversion."""
    amount: float = Field(..., gt=0, description="Amount to convert")
    from_currency: str = Field(default="CAD", max_length=3)
    to_currency: str = Field(default="TWD", max_length=3)


class ExchangeRateResponse(BaseModel):
    """Response with converted amount."""
    original_amount: float
    converted_amount: float
    from_currency: str
    to_currency: str
    exchange_rate: float
    last_updated: datetime


class SupportedCurrency(BaseModel):
    """Supported currency info."""
    code: str
    name: str
    symbol: str


# ============ API Response Models ============

class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    message: str = "Success"
    data: Optional[dict] = None


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: List[dict]
    total: int
    page: int
    page_size: int


# ============ Password Protection Models ============

class PasswordVerify(BaseModel):
    """Schema for password verification."""
    password: str = Field(..., min_length=1, max_length=100, description="Password to verify")


class PasswordSet(BaseModel):
    """Schema for setting/updating password."""
    password: str = Field(..., min_length=4, max_length=100, description="New password (min 4 chars)")
    current_password: Optional[str] = Field(default=None, description="Current password (required for update)")


class PasswordVerifyResponse(BaseModel):
    """Response for password verification."""
    valid: bool = Field(..., description="Whether password is valid")
    message: str = Field(default="", description="Response message")
