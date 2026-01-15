"""
Trip API Routes
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.models import (
    Trip, TripCreate, TripUpdate, TripSummary,
    BacklogPlace, ItineraryItem, BudgetItem,
    APIResponse, PaginatedResponse,
    PasswordVerify, PasswordSet, PasswordVerifyResponse
)
from app.services.trip_service import trip_service

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("", response_model=PaginatedResponse)
async def get_all_trips(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query")
):
    """
    獲取所有旅程清單
    
    Get all trips with pagination and optional search.
    """
    skip = (page - 1) * page_size
    trips, total = await trip_service.get_all_trips(skip, page_size, search)
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=trips,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=APIResponse)
async def create_trip(trip_data: TripCreate):
    """
    建立新旅程
    
    Create a new trip with automatic itinerary day generation.
    """
    trip_id = await trip_service.create_trip(trip_data)
    
    return APIResponse(
        success=True,
        message="Trip created successfully",
        data={"trip_id": trip_id}
    )


@router.get("/{trip_id}")
async def get_trip(trip_id: str):
    """
    獲取單一旅程詳情
    
    Get a single trip by ID with all details.
    """
    trip = await trip_service.get_trip(trip_id)
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return trip


@router.put("/{trip_id}", response_model=APIResponse)
async def update_trip(trip_id: str, update_data: TripUpdate):
    """
    更新旅程
    
    Update trip details, backlog places, or itinerary.
    """
    success = await trip_service.update_trip(trip_id, update_data)
    
    if not success:
        raise HTTPException(status_code=404, detail="Trip not found or update failed")
    
    return APIResponse(
        success=True,
        message="Trip updated successfully"
    )


@router.delete("/{trip_id}", response_model=APIResponse)
async def delete_trip(trip_id: str):
    """
    刪除旅程
    
    Delete a trip permanently.
    """
    success = await trip_service.delete_trip(trip_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return APIResponse(
        success=True,
        message="Trip deleted successfully"
    )


@router.get("/{trip_id}/statistics")
async def get_trip_statistics(trip_id: str):
    """
    獲取旅程統計數據
    
    Get trip statistics including budget summary and activity counts.
    """
    stats = await trip_service.get_trip_statistics(trip_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return stats


# ============ Backlog Place Endpoints ============

@router.post("/{trip_id}/backlog", response_model=APIResponse)
async def add_backlog_place(trip_id: str, place: BacklogPlace):
    """
    新增候選景點
    
    Add a new place to the trip's backlog.
    """
    place_id = await trip_service.add_backlog_place(trip_id, place)
    
    if not place_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return APIResponse(
        success=True,
        message="Place added to backlog",
        data={"place_id": place_id}
    )


@router.delete("/{trip_id}/backlog/{place_id}", response_model=APIResponse)
async def remove_backlog_place(trip_id: str, place_id: str):
    """
    移除候選景點
    
    Remove a place from the backlog.
    """
    success = await trip_service.remove_backlog_place(trip_id, place_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Trip or place not found")
    
    return APIResponse(
        success=True,
        message="Place removed from backlog"
    )


# ============ Itinerary Endpoints ============

@router.post("/{trip_id}/itinerary/{date}/items", response_model=APIResponse)
async def add_itinerary_item(trip_id: str, date: str, item: ItineraryItem):
    """
    新增行程項目
    
    Add an item to a specific day's itinerary.
    """
    item_id = await trip_service.add_itinerary_item(trip_id, date, item)
    
    if not item_id:
        raise HTTPException(status_code=404, detail="Trip or date not found")
    
    return APIResponse(
        success=True,
        message="Item added to itinerary",
        data={"item_id": item_id}
    )


@router.put("/{trip_id}/itinerary/{date}/items", response_model=APIResponse)
async def update_day_itinerary(trip_id: str, date: str, items: list[ItineraryItem]):
    """
    更新當日行程順序
    
    Update the order of items in a day's itinerary (for drag-drop reordering).
    """
    success = await trip_service.update_day_itinerary(trip_id, date, items)
    
    if not success:
        raise HTTPException(status_code=404, detail="Trip or date not found")
    
    return APIResponse(
        success=True,
        message="Itinerary updated"
    )


@router.put("/{trip_id}/itinerary/{date}/notes", response_model=APIResponse)
async def update_daily_notes(trip_id: str, date: str, notes: dict):
    """
    更新當日備註
    
    Update the notes for a specific day.
    """
    success = await trip_service.update_daily_notes(trip_id, date, notes.get("content", ""))
    
    if not success:
        raise HTTPException(status_code=404, detail="Trip or date not found")
    
    return APIResponse(
        success=True,
        message="Notes updated"
    )


# ============ Budget Endpoints ============

@router.post("/{trip_id}/itinerary/{date}/budget", response_model=APIResponse)
async def add_budget_item(trip_id: str, date: str, budget_item: BudgetItem):
    """
    新增預算項目
    
    Add a budget/expense item to a specific day.
    """
    item_id = await trip_service.add_budget_item(trip_id, date, budget_item)
    
    if not item_id:
        raise HTTPException(status_code=404, detail="Trip or date not found")
    
    return APIResponse(
        success=True,
        message="Budget item added",
        data={"item_id": item_id}
    )


# ============ Password Protection Endpoints ============

@router.post("/{trip_id}/password/verify", response_model=APIResponse)
async def verify_trip_password(trip_id: str, password_data: PasswordVerify):
    """
    驗證行程密碼
    
    Verify password for trip edit access.
    """
    is_valid = await trip_service.verify_password(trip_id, password_data.password)
    
    if is_valid is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return APIResponse(
        success=True,
        message="Password valid" if is_valid else "Invalid password",
        data={"valid": is_valid}
    )


@router.post("/{trip_id}/password/set", response_model=APIResponse)
async def set_trip_password(trip_id: str, password_data: PasswordSet):
    """
    設定或更新行程密碼
    
    Set or update trip password. Requires current password if already protected.
    """
    print(f"DEBUG: Setting password for trip {trip_id}")
    print(f"DEBUG: password_data.password = {password_data.password}")
    print(f"DEBUG: password_data.current_password = {password_data.current_password}")
    
    success, message = await trip_service.set_password(
        trip_id,
        password_data.password,
        password_data.current_password
    )
    
    print(f"DEBUG: success = {success}, message = {message}")
    
    if not success:
        if "not found" in message.lower():
            raise HTTPException(status_code=404, detail=message)
        else:
            raise HTTPException(status_code=403, detail=message)
    
    return APIResponse(
        success=True,
        message=message
    )


@router.post("/{trip_id}/password/remove", response_model=APIResponse)
async def remove_trip_password(trip_id: str, password_data: PasswordVerify):
    """
    移除行程密碼保護
    
    Remove password protection from trip. Requires current password.
    """
    success, message = await trip_service.remove_password(trip_id, password_data.password)
    
    if not success:
        if "not found" in message.lower():
            raise HTTPException(status_code=404, detail=message)
        else:
            raise HTTPException(status_code=403, detail=message)
    
    return APIResponse(
        success=True,
        message=message
    )
