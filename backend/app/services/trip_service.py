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
import bcrypt


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
            "members": [],
            "expenses": [],
            "base_currency": trip_data.base_currency or "TWD",
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
            trip_data = await collection.find_one({"_id": ObjectId(trip_id)})
            if trip_data:
                trip_data["_id"] = str(trip_data["_id"])
                # Calculate total budget
                total = 0
                for day in trip_data.get("itinerary", []):
                    for budget_item in day.get("budget_items", []):
                        total += budget_item.get("cost", 0)
                trip_data["total_budget"] = total
                
                # Convert to Trip model to get computed fields (like is_protected)
                from app.models import Trip
                trip_model = Trip(**trip_data)
                # Use model_dump to get dict with computed fields and exclude password_hash
                return trip_model.model_dump()
            return None
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
                elif key == "place_groups":
                    # Ensure all groups have IDs and metadata
                    for group in value:
                        if not group.get("id"):
                            group["id"] = generate_id()
                        if not group.get("created_at"):
                            group["created_at"] = datetime.utcnow()
                elif key == "itinerary":
                    # Ensure all items have IDs
                    for day in value:
                        for item in day.get("items", []):
                            if not item.get("id"):
                                item["id"] = generate_id()
                        for budget in day.get("budget_items", []):
                            if not budget.get("id"):
                                budget["id"] = generate_id()
                elif key == "expenses":
                    # Ensure all expenses have IDs
                    for expense in value:
                        if not expense.get("id"):
                            expense["id"] = generate_id()
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
    
    @staticmethod
    async def verify_password(trip_id: str, password: str) -> Optional[bool]:
        """Verify password for a trip. Returns True if password is correct or trip has no password."""
        collection = get_trips_collection()
        trip = await collection.find_one({"_id": ObjectId(trip_id)})
        
        print(f"DEBUG verify: trip_id={trip_id}, password={password}")
        
        if not trip:
            print("DEBUG verify: Trip not found")
            return None
        
        # If trip has no password, allow access
        stored_hash = trip.get("password_hash")
        print(f"DEBUG verify: stored_hash={stored_hash}")
        
        if not stored_hash:
            print("DEBUG verify: No password set, allowing access")
            return True
        
        # Verify password against stored hash
        print(f"DEBUG verify: Checking password...")
        result = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        print(f"DEBUG verify: Password check result={result}")
        return result
    
    @staticmethod
    async def set_password(trip_id: str, new_password: str, current_password: Optional[str] = None) -> tuple[bool, str]:
        """Set or update password for a trip. If password exists, current_password must be provided."""
        collection = get_trips_collection()
        trip = await collection.find_one({"_id": ObjectId(trip_id)})
        
        print(f"DEBUG service: trip_id={trip_id}, new_password={new_password}, current_password={current_password}")
        
        if not trip:
            print("DEBUG service: Trip not found")
            return False, "Trip not found"
        
        # If trip already has a password, verify current password first
        stored_hash = trip.get("password_hash")
        print(f"DEBUG service: stored_hash={stored_hash}")
        
        if stored_hash:
            print("DEBUG service: Trip has existing password, checking current password")
            if not current_password:
                print("DEBUG service: Current password required but not provided")
                return False, "Current password required"
            if not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
                print("DEBUG service: Invalid current password")
                return False, "Invalid current password"
        
        print("DEBUG service: Hashing new password")
        # Hash the new password
        salt = bcrypt.gensalt()
        new_hash = bcrypt.hashpw(new_password.encode('utf-8'), salt)
        
        print(f"DEBUG service: Updating trip with new hash")
        # Update the trip with new password hash
        result = await collection.update_one(
            {"_id": ObjectId(trip_id)},
            {"$set": {"password_hash": new_hash.decode('utf-8')}}
        )
        
        print(f"DEBUG service: modified_count={result.modified_count}, matched_count={result.matched_count}")
        
        if result.modified_count > 0 or result.matched_count > 0:
            return True, "Password set successfully"
        return False, "Failed to set password"
    
    @staticmethod
    async def remove_password(trip_id: str, current_password: str) -> tuple[bool, str]:
        """Remove password protection from a trip. Requires current password verification."""
        collection = get_trips_collection()
        trip = await collection.find_one({"_id": ObjectId(trip_id)})
        
        if not trip:
            return False, "Trip not found"
        
        # Verify current password
        stored_hash = trip.get("password_hash")
        if not stored_hash:
            # Already no password
            return True, "Password protection already removed"
        
        if not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
            return False, "Invalid password"
        
        # Remove password hash
        result = await collection.update_one(
            {"_id": ObjectId(trip_id)},
            {"$unset": {"password_hash": ""}}
        )
        
        if result.modified_count > 0:
            return True, "Password protection removed"
        return False, "Failed to remove password"


trip_service = TripService()
