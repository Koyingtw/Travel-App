"""
Route Optimization Service
Uses OR-Tools for Traveling Salesman Problem (TSP) optimization
"""
from typing import List, Optional, Tuple
from math import radians, sin, cos, sqrt, atan2
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from app.models import RoutePoint, OptimizedRoute


class RouteOptimizer:
    """Route optimization using OR-Tools TSP solver."""
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees).
        Returns distance in kilometers.
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def create_distance_matrix(points: List[RoutePoint]) -> List[List[int]]:
        """Create a distance matrix for the given points."""
        n = len(points)
        matrix = [[0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    dist = RouteOptimizer.haversine_distance(
                        points[i].lat, points[i].lng,
                        points[j].lat, points[j].lng
                    )
                    # Convert to meters and round to integer for OR-Tools
                    matrix[i][j] = int(dist * 1000)
        
        return matrix
    
    @staticmethod
    def optimize_route(
        points: List[RoutePoint],
        start_index: Optional[int] = None,
        end_index: Optional[int] = None
    ) -> Tuple[List[RoutePoint], float, int]:
        """
        Optimize the route using TSP solver.
        
        Args:
            points: List of route points
            start_index: Index of the fixed starting point (optional)
            end_index: Index of the fixed ending point (optional)
        
        Returns:
            Tuple of (ordered points, total distance in km, estimated duration in minutes)
        """
        if len(points) < 2:
            return points, 0.0, 0
        
        if len(points) == 2:
            dist = RouteOptimizer.haversine_distance(
                points[0].lat, points[0].lng,
                points[1].lat, points[1].lng
            )
            # Estimate 2 minutes per km average driving
            duration = int(dist * 2)
            return points, dist, duration
        
        # Create distance matrix
        distance_matrix = RouteOptimizer.create_distance_matrix(points)
        
        # Create routing model
        manager = pywrapcp.RoutingIndexManager(
            len(points),
            1,  # Number of vehicles
            start_index if start_index is not None else 0  # Depot
        )
        
        routing = pywrapcp.RoutingModel(manager)
        
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = 5  # Limit search time
        
        # Solve
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            # Extract the route
            ordered_points = []
            total_distance = 0
            
            index = routing.Start(0)
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                ordered_points.append(points[node_index])
                
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                total_distance += routing.GetArcCostForVehicle(previous_index, index, 0)
            
            # Add the last point
            node_index = manager.IndexToNode(index)
            if node_index < len(points):
                ordered_points.append(points[node_index])
            
            # Convert distance from meters to kilometers
            total_distance_km = total_distance / 1000
            
            # Estimate duration (assume average 40 km/h in city, 80 km/h highway)
            # Using 50 km/h average = ~1.2 min per km
            estimated_duration = int(total_distance_km * 1.2)
            
            return ordered_points, total_distance_km, estimated_duration
        
        # If no solution found, return original order
        total_dist = sum(
            RouteOptimizer.haversine_distance(
                points[i].lat, points[i].lng,
                points[i+1].lat, points[i+1].lng
            )
            for i in range(len(points) - 1)
        )
        return points, total_dist, int(total_dist * 1.2)
    
    @staticmethod
    def generate_polyline_points(points: List[RoutePoint]) -> List[dict]:
        """Generate polyline coordinates for map display."""
        return [{"lat": p.lat, "lng": p.lng} for p in points]


async def optimize_route(
    points: List[RoutePoint],
    start_point_id: Optional[str] = None,
    end_point_id: Optional[str] = None
) -> OptimizedRoute:
    """
    Main function to optimize a route.
    
    Args:
        points: List of route points to optimize
        start_point_id: ID of the point that must be first
        end_point_id: ID of the point that must be last
    
    Returns:
        OptimizedRoute with ordered points and metrics
    """
    # Find start/end indices if specified
    start_index = None
    end_index = None
    
    if start_point_id:
        for i, p in enumerate(points):
            if p.id == start_point_id:
                start_index = i
                break
    
    if end_point_id:
        for i, p in enumerate(points):
            if p.id == end_point_id:
                end_index = i
                break
    
    # Optimize
    ordered_points, total_distance, duration = RouteOptimizer.optimize_route(
        points, start_index, end_index
    )
    
    return OptimizedRoute(
        ordered_points=ordered_points,
        total_distance_km=round(total_distance, 2),
        estimated_duration_minutes=duration,
        polyline=None  # Could be encoded polyline if needed
    )
