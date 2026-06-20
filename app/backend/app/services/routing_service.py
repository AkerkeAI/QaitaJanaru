import requests
import os
from typing import Optional, Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

class RoutingService:
    """Service for OpenRouteService routing API calls"""
    
    def __init__(self):
        self.api_key = os.getenv("ORS_API_KEY")
        self.base_url = "https://api.openrouteservice.org/v2/directions/driving"
        
        if not self.api_key:
            logger.error("ORS_API_KEY not found in environment variables")
            raise RuntimeError("ORS_API_KEY not configured")
    
    def get_route(
        self,
        start_lat: float,
        start_lon: float,
        destination_lat: float,
        destination_lon: float,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Get route from OpenRouteService
        
        Args:
            start_lat: Starting latitude
            start_lon: Starting longitude
            destination_lat: Destination latitude
            destination_lon: Destination longitude
            language: Language code for instructions
            
        Returns:
            Dictionary with route geometry, distance, duration
            
        Raises:
            RuntimeError: If API call fails
        """
        try:
            # Construct request
            headers = {
                "Authorization": self.api_key,
                "Content-Type": "application/json"
            }
            
            # ORS expects [lon, lat] order
            coordinates = [
                [start_lon, start_lat],
                [destination_lon, destination_lat]
            ]
            
            params = {
                "coordinates": coordinates,
                "format": "geojson",
                "language": language,
                "geometry": "true",
                "instructions": "false",
                "units": "km"
            }
            
            logger.info(f"Calling ORS with coordinates: {coordinates}")
            
            response = requests.post(
                self.base_url,
                json=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                logger.error("ORS_API_KEY is invalid")
                raise RuntimeError("ROUTING_INVALID_KEY")
            
            if response.status_code == 429:
                logger.error("ORS API rate limit exceeded")
                raise RuntimeError("ROUTING_RATE_LIMIT")
            
            if response.status_code >= 500:
                logger.error(f"ORS server error: {response.status_code}")
                raise RuntimeError("ROUTING_SERVER_ERROR")
            
            if response.status_code != 200:
                logger.error(f"ORS API error: {response.status_code} - {response.text}")
                raise RuntimeError(f"ROUTING_API_ERROR_{response.status_code}")
            
            data = response.json()
            
            # Extract route data from GeoJSON response
            if "routes" not in data or len(data["routes"]) == 0:
                logger.error("No route found in ORS response")
                raise RuntimeError("ROUTING_NO_ROUTE_FOUND")
            
            route = data["routes"][0]
            
            # Extract geometry (list of [lon, lat] coordinates)
            geometry = route.get("geometry", {})
            if geometry.get("type") == "LineString":
                # Convert from [lon, lat] to [lat, lon] for Leaflet
                coordinates_latlon = [
                    [coord[1], coord[0]] for coord in geometry.get("coordinates", [])
                ]
            else:
                coordinates_latlon = []
            
            # Extract distance and duration
            summary = route.get("summary", {})
            distance_km = summary.get("distance", 0) / 1000  # ORS returns meters
            duration_seconds = summary.get("duration", 0)
            duration_minutes = round(duration_seconds / 60)
            
            logger.info(f"Route found: {distance_km:.1f}km, {duration_minutes}min")
            
            return {
                "geometry": coordinates_latlon,
                "distance_km": round(distance_km, 1),
                "duration_minutes": max(1, duration_minutes),
                "start": {"lat": start_lat, "lon": start_lon},
                "destination": {"lat": destination_lat, "lon": destination_lon},
                "success": True
            }
            
        except requests.exceptions.Timeout:
            logger.error("ORS API timeout")
            raise RuntimeError("ROUTING_TIMEOUT")
        except requests.exceptions.ConnectionError:
            logger.error("ORS API connection error")
            raise RuntimeError("ROUTING_CONNECTION_ERROR")
        except Exception as e:
            logger.error(f"Unexpected error in routing service: {str(e)}")
            raise RuntimeError(f"ROUTING_ERROR: {str(e)}")


def get_routing_service() -> RoutingService:
    """Factory function to get routing service instance"""
    return RoutingService()
