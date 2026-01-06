"""
Trip Service - Business logic for trip operations
"""
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_trips_collection
from app.models import (
    Trip, TripCreate, TripUpdate, TripSummary,
    BacklogPlace, DayItinerary, ItineraryItem, BudgetItem
)
import uuid


def generate_id() -> str:
    """Generate a unique ID for sub-documents."""
    return str(uuid.uuid4())[:8]


class TripService:
    """Service class for trip-related operations."""
    
    @staticmethod
    async def create_trip(trip_data: TripCreate) -> str:
        """Create a new trip and return its ID."""
        collection = get_trips_collection()
        
        # Parse dates to generate empty itinerary days
        start = datetime.strptime(trip_data.start_date, "%Y-%m-%d")
        end = datetime.strptime(trip_data.end_date, "%Y-%m-%d")
        
        # Generate itinerary structure for each day
        itinerary = []
        current = start
        while current <= end:
            itinerary.append({
                "date": current.strftime("%Y-%m-%d"),
                "items": [],
                "daily_notes": "",
                "budget_items": [],
                "weather": None
            })
            current += timedelta(days=1)
        
        # Process backlog places with IDs
        backlog_places = []
        for place in trip_data.backlog_places:
            place_dict = place.model_dump()
            place_dict["id"] = generate_id()
            if place_dict.get("coordinates"):
                place_dict["coordinates"] = {
                    "lat": place_dict["coordinates"]["lat"],
                    "lng": place_dict["coordinates"]["lng"]
                }
            backlog_places.append(place_dict)
        
        trip_doc = {
            "title": trip_data.title,
            "description": trip_data.description,
            "destination": trip_data.destination,
            "start_date": trip_data.start_date,
            "end_date": trip_data.end_date,
            "cover_image": trip_data.cover_image,
            "tags": trip_data.tags,
            "backlog_places": backlog_places,
            "itinerary": itinerary,
            "total_budget": 0,
            "user_id": None,  # For future auth implementation
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(trip_doc)
        return str(result.inserted_id)
    
    @staticmethod
    async def get_trip(trip_id: str) -> Optional[dict]:
        """Get a single trip by ID."""
        collection = get_trips_collection()
        
        try:
            trip = await collection.find_one({"_id": ObjectId(trip_id)})
            if trip:
                trip["_id"] = str(trip["_id"])
                # Calculate total budget
                total = 0
                for day in trip.get("itinerary", []):
                    for budget_item in day.get("budget_items", []):
                        total += budget_item.get("cost", 0)
                trip["total_budget"] = total
            return trip
        except Exception:
            return None
    
    @staticmethod
    async def get_all_trips(
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None
    ) -> tuple[List[dict], int]:
        """Get all trips with pagination."""
        collection = get_trips_collection()
        
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"destination": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search]}}
            ]
        
        # Get total count
        total = await collection.count_documents(query)
        
        # Get trips
        cursor = collection.find(query).sort("start_date", -1).skip(skip).limit(limit)
        trips = []
        
        async for trip in cursor:
            trip["_id"] = str(trip["_id"])
            # Add summary fields
            trip["total_places"] = len(trip.get("backlog_places", []))
            trip["total_days"] = len(trip.get("itinerary", []))
            trips.append(trip)
        
        return trips, total
    
    @staticmethod
    async def update_trip(trip_id: str, update_data: TripUpdate) -> bool:
        """Update a trip."""
        collection = get_trips_collection()
        
        # Build update document
        update_doc = {"updated_at": datetime.utcnow()}
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for key, value in update_dict.items():
            if value is not None:
                if key == "backlog_places":
                    # Ensure all places have IDs
                    for place in value:
                        if not place.get("id"):
                            place["id"] = generate_id()
                        if place.get("coordinates"):
                            place["coordinates"] = {
                                "lat": place["coordinates"]["lat"],
                                "lng": place["coordinates"]["lng"]
                            }
                elif key == "itinerary":
                    # Ensure all items have IDs
                    for day in value:
                        for item in day.get("items", []):
                            if not item.get("id"):
                                item["id"] = generate_id()
                        for budget in day.get("budget_items", []):
                            if not budget.get("id"):
                                budget["id"] = generate_id()
                update_doc[key] = value
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(trip_id)},
                {"$set": update_doc}
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    @staticmethod
    async def delete_trip(trip_id: str) -> bool:
        """Delete a trip."""
        collection = get_trips_collection()
        
        try:
            result = await collection.delete_one({"_id": ObjectId(trip_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    @staticmethod
    async def add_backlog_place(trip_id: str, place: BacklogPlace) -> Optional[str]:
        """Add a place to the backlog."""
        collection = get_trips_collection()
        
        place_dict = place.model_dump()
        place_dict["id"] = generate_id()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(trip_id)},
                {
                    "$push": {"backlog_places": place_dict},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            if result.modified_count > 0:
                return place_dict["id"]
            return None
        except Exception:
            return None
    
    @staticmethod
    async def remove_backlog_place(trip_id: str, place_id: str) -> bool:
        """Remove a place from the backlog."""
        collection = get_trips_collection()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(trip_id)},
                {
                    "$pull": {"backlog_places": {"id": place_id}},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    @staticmethod
    async def add_itinerary_item(
        trip_id: str,
        date: str,
        item: ItineraryItem
    ) -> Optional[str]:
        """Add an item to a day's itinerary."""
        collection = get_trips_collection()
        
        item_dict = item.model_dump()
        item_dict["id"] = generate_id()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(trip_id), "itinerary.date": date},
                {
                    "$push": {"itinerary.$.items": item_dict},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            if result.modified_count > 0:
                return item_dict["id"]
            return None
        except Exception:
            return None
    
    @staticmethod
    async def update_day_itinerary(
        trip_id: str,
        date: str,
        items: List[ItineraryItem]
    ) -> bool:
        """Update a day's itinerary items (for reordering after drag-drop or optimization)."""
        collection = get_trips_collection()
        
        items_list = []
        for i, item in enumerate(items):
            item_dict = item.model_dump() if hasattr(item, 'model_dump') else item
            if not item_dict.get("id"):
                item_dict["id"] = generate_id()
            item_dict["order"] = i
            items_list.append(item_dict)
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(trip_id), "itinerary.date": date},
                {
                    "$set": {
                        "itinerary.$.items": items_list,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    @staticmethod
    async def update_daily_notes(trip_id: str, date: str, notes: str) -> bool:
        """Update a day's notes."""
        collection = get_trips_collection()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(trip_id), "itinerary.date": date},
                {
                    "$set": {
                        "itinerary.$.daily_notes": notes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    @staticmethod
    async def add_budget_item(
        trip_id: str,
        date: str,
        budget_item: BudgetItem
    ) -> Optional[str]:
        """Add a budget item to a day."""
        collection = get_trips_collection()
        
        item_dict = budget_item.model_dump()
        item_dict["id"] = generate_id()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(trip_id), "itinerary.date": date},
                {
                    "$push": {"itinerary.$.budget_items": item_dict},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            if result.modified_count > 0:
                return item_dict["id"]
            return None
        except Exception:
            return None
    
    @staticmethod
    async def get_trip_statistics(trip_id: str) -> dict:
        """Get statistics for a trip."""
        trip = await TripService.get_trip(trip_id)
        
        if not trip:
            return {}
        
        total_budget = 0
        total_activities = 0
        categories = {}
        
        for day in trip.get("itinerary", []):
            for item in day.get("items", []):
                total_activities += 1
                cat = item.get("category", "other")
                categories[cat] = categories.get(cat, 0) + 1
            
            for budget in day.get("budget_items", []):
                total_budget += budget.get("cost", 0)
        
        return {
            "total_days": len(trip.get("itinerary", [])),
            "total_backlog_places": len(trip.get("backlog_places", [])),
            "total_planned_activities": total_activities,
            "total_budget": total_budget,
            "activities_by_category": categories
        }


trip_service = TripService()
