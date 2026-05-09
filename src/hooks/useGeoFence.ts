import { useState, useEffect, useCallback } from "react";
import { GeolocationCoordinates } from "@/types";
import { firebaseHelpers } from "@/lib/firebase";

export interface GeoFenceSettings {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// Default settings if not found in db
const DEFAULT_GEOFENCE: GeoFenceSettings = {
  latitude: 37.7749, // Example default (San Francisco)
  longitude: -122.4194,
  radiusMeters: 100, // 100 meters
};

// Calculate distance in meters using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const useGeoFence = (currentLocation: GeolocationCoordinates | null) => {
  const [settings, setSettings] = useState<GeoFenceSettings>(DEFAULT_GEOFENCE);
  const [isInside, setIsInside] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Fetch geofence settings (admin configured)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsData = await firebaseHelpers.getSettings("geofence");
        if (settingsData && settingsData.latitude) {
          setSettings({
            latitude: settingsData.latitude,
            longitude: settingsData.longitude,
            radiusMeters: settingsData.radiusMeters || 100,
          });
        }
      } catch (error) {
        console.error("Error fetching geofence settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Check if current location is within the geofence
  useEffect(() => {
    if (currentLocation && settings) {
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        settings.latitude,
        settings.longitude
      );
      setDistance(dist);
      setIsInside(dist <= settings.radiusMeters);
    } else {
      setIsInside(false);
      setDistance(null);
    }
  }, [currentLocation, settings]);

  return { isInside, distance, settings };
};
