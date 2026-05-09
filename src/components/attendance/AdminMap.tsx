"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { AttendanceRecord } from "@/types";

// Fix for default marker icons in react-leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const redIcon = L.icon({
  ...icon.options,
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
});

interface AdminMapProps {
  records: AttendanceRecord[];
  geofenceSettings: { latitude: number; longitude: number; radiusMeters: number } | null;
}

export default function AdminMap({ records, geofenceSettings }: AdminMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-96 w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">Loading Map...</div>;
  }

  const center: [number, number] = geofenceSettings 
    ? [geofenceSettings.latitude, geofenceSettings.longitude] 
    : (records.length > 0 ? [records[0].location.latitude, records[0].location.longitude] : [37.7749, -122.4194]);

  return (
    <div className="h-full min-h-[600px] w-full rounded-lg overflow-hidden border border-slate-200">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {geofenceSettings && (
          <Circle 
            center={[geofenceSettings.latitude, geofenceSettings.longitude]} 
            radius={geofenceSettings.radiusMeters} 
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
          />
        )}

        {records.map((record) => (
          <Marker 
            key={record.id || Math.random().toString()} 
            position={[record.location.latitude, record.location.longitude]}
            icon={record.verified === false ? redIcon : icon}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-sm mb-1">User ID: {record.userId.substring(0, 8)}...</p>
                <p className="text-xs mb-1">Time: {new Date(record.checkInTime).toLocaleString()}</p>
                <p className="text-xs mb-1">Method: {record.method || 'manual'}</p>
                <p className="text-xs mb-2">Status: {record.verified ? 'Verified' : 'Pending Review'}</p>
                {record.photoUrl && (
                  <div className="mt-2">
                    <img src={record.photoUrl} alt="Selfie Verification" className="w-full rounded h-24 object-cover" />
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
