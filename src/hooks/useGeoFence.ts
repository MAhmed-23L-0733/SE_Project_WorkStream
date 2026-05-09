"use client";

import { useState, useEffect, useCallback } from "react";
import { GeofenceSettings, GeolocationCoordinates } from "@/types";
import { firebaseHelpers } from "@/lib/firebase";

export const useGeoFence = () => {
  const [settings, setSettings] = useState<GeofenceSettings | null>(null);
  const [isInside, setIsInside] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const fetchSettings = useCallback(async () => {
    try {
      const data = await firebaseHelpers.getGeofenceSettings();
      if (data) {
        setSettings(data as GeofenceSettings);
      }
    } catch (err) {
      setError("Failed to fetch geofence settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const checkLocation = useCallback((coords: GeolocationCoordinates) => {
    if (!settings) return;

    const dist = calculateDistance(
      coords.latitude,
      coords.longitude,
      settings.latitude,
      settings.longitude
    );

    setDistance(dist);
    setIsInside(dist <= settings.radius);
  }, [settings]);

  return { settings, isInside, distance, loading, error, checkLocation, refreshSettings: fetchSettings };
};
