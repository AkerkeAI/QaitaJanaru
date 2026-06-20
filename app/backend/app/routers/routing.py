from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from app.services.routing_service import get_routing_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/routes", tags=["routing"])


class NavigationRequest(BaseModel):
    """Request model for navigation endpoint"""
    start_lat: float
    start_lon: float
    destination_lat: float
    destination_lon: float


class NavigationResponse(BaseModel):
    """Response model for navigation endpoint"""
    geometry: list  # [[lat, lon], ...]
    distance_km: float
    duration_minutes: int
    start: dict  # {"lat": float, "lon": float}
    destination: dict  # {"lat": float, "lon": float}
    success: bool


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    message: str


@router.post("/navigation", response_model=NavigationResponse, responses={
    400: {"model": ErrorResponse},
    503: {"model": ErrorResponse}
})
async def get_navigation(request: NavigationRequest):
    """
    Get navigation route between two points
    
    **Parameters:**
    - `start_lat`: User's starting latitude
    - `start_lon`: User's starting longitude
    - `destination_lat`: Destination latitude
    - `destination_lon`: Destination longitude
    
    **Returns:**
    - Route geometry (list of [lat, lon] coordinates)
    - Distance in kilometers
    - Estimated duration in minutes
    - Start and destination coordinates
    
    **Errors:**
    - 400: Invalid coordinates
    - 503: Routing service unavailable
    """
    try:
        # Validate coordinates
        if not (-90 <= request.start_lat <= 90 and -180 <= request.start_lon <= 180):
            raise HTTPException(status_code=400, detail="Invalid start coordinates")
        
        if not (-90 <= request.destination_lat <= 90 and -180 <= request.destination_lon <= 180):
            raise HTTPException(status_code=400, detail="Invalid destination coordinates")
        
        # Get routing service
        routing_service = get_routing_service()
        
        # Get route from ORS
        route_data = routing_service.get_route(
            start_lat=request.start_lat,
            start_lon=request.start_lon,
            destination_lat=request.destination_lat,
            destination_lon=request.destination_lon
        )
        
        return NavigationResponse(**route_data)
        
    except RuntimeError as e:
        error_msg = str(e)
        logger.error(f"Routing error: {error_msg}")
        
        # Map error codes to user-friendly messages
        error_messages = {
            "ROUTING_INVALID_KEY": "Routing service is not properly configured",
            "ROUTING_RATE_LIMIT": "Too many requests to routing service. Please try again later",
            "ROUTING_SERVER_ERROR": "Routing service is temporarily unavailable",
            "ROUTING_API_ERROR": "Routing service returned an error",
            "ROUTING_NO_ROUTE_FOUND": "No route found between the specified locations",
            "ROUTING_TIMEOUT": "Routing service request timed out",
            "ROUTING_CONNECTION_ERROR": "Cannot connect to routing service"
        }
        
        user_message = error_messages.get(error_msg, "Unable to calculate route")
        
        raise HTTPException(
            status_code=503,
            detail=user_message
        )
    
    except Exception as e:
        logger.error(f"Unexpected error in navigation endpoint: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Unable to calculate route"
        )
