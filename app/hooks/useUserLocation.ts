"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserCoordinates {
  lat: number;
  lng: number;
}

interface UseUserLocationOptions {
  requestOnMount?: boolean;
}

export function useUserLocation(options: UseUserLocationOptions = {}) {
  const { requestOnMount = false } = options;
  const [location, setLocation] = useState<UserCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermissionGranted(false);
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setPermissionGranted(true);
        setLoading(false);
      },
      () => {
        setLocation(null);
        setPermissionGranted(false);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    if (requestOnMount) {
      requestLocation();
    }
  }, [requestOnMount, requestLocation]);

  return {
    location,
    loading,
    permissionGranted,
    requestLocation,
  };
}
