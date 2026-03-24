"""
Route Optimization API Routes
"""
from fastapi import APIRouter, HTTPException
from app.models import OptimizeRouteRequest, OptimizedRoute
from app.services.route_optimizer import optimize_route

router = APIRouter(prefix="/optimize-route", tags=["Route Optimization"])


@router.post("", response_model=OptimizedRoute)
async def optimize_route_endpoint(request: OptimizeRouteRequest):
    """
    路徑優化
    
    Optimize the order of places for the shortest route.
    Uses TSP (Traveling Salesman Problem) algorithm.
    
    - **points**: List of places with coordinates
    - **start_point_id**: Optional fixed starting point
    - **end_point_id**: Optional fixed ending point
    - **optimize_for**: "distance" or "time"
    
    Returns ordered list of places and estimated metrics.
    """
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 points required for optimization"
        )
    
    if len(request.points) > 25:
        raise HTTPException(
            status_code=400,
            detail="Maximum 25 points allowed for optimization"
        )
    
    result = await optimize_route(
        points=request.points,
        start_point_id=request.start_point_id,
        end_point_id=request.end_point_id,
        travel_mode=request.travel_mode
    )
    
    return result
