'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrafficSegment {
  id: string;
  name: string;
  level: 'frei' | 'leicht' | 'stockend' | 'stau';
  speed: number;
  freeFlowSpeed: number;
  delay: number;
  distance: number;
  duration: number;
  durationInTraffic: number;
}

interface RouteInfo {
  description: string;
  icon: string;
  lat: number;
  lng: number;
}

interface TrafficMapProps {
  segments: TrafficSegment[];
  selectedRoute: string | null;
  onSelectRoute: (id: string) => void;
  routeInfo: Record<string, RouteInfo>;
  center: { lat: number; lng: number };
  getTrafficStyle: (level: string) => {
    bg: string;
    text: string;
    border: string;
    dot: string;
    label: string;
    gradient: string;
  };
}

// Farben für Traffic-Level
const TRAFFIC_COLORS: Record<string, string> = {
  frei: '#22c55e',
  leicht: '#84cc16',
  stockend: '#f59e0b',
  stau: '#ef4444',
};

// Custom Marker Icon erstellen
function createCustomIcon(label: string, color: string, isSelected: boolean) {
  return L.divIcon({
    className: 'custom-traffic-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: ${isSelected ? '3px solid #1e293b' : '2px solid white'};
        transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
        transition: transform 0.2s;
      ">${label}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Zernsdorf Center Marker
function createCenterIcon() {
  return L.divIcon({
    className: 'custom-center-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: #059669;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Komponente um ausgewählten Marker zu zentrieren
function MapController({ selectedRoute, routeInfo }: { selectedRoute: string | null; routeInfo: Record<string, RouteInfo> }) {
  const map = useMap();

  useEffect(() => {
    if (selectedRoute && routeInfo[selectedRoute]) {
      const { lat, lng } = routeInfo[selectedRoute];
      map.flyTo([lat, lng], 13, { duration: 0.5 });
    }
  }, [selectedRoute, routeInfo, map]);

  return null;
}

export default function TrafficMap({
  segments,
  selectedRoute,
  onSelectRoute,
  routeInfo,
  center,
  getTrafficStyle,
}: TrafficMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selectedRoute={selectedRoute} routeInfo={routeInfo} />

      {/* Zernsdorf Center Marker */}
      <Marker position={[center.lat, center.lng]} icon={createCenterIcon()}>
        <Popup>
          <div className="text-center">
            <strong>Zernsdorf</strong>
            <br />
            <span className="text-sm text-slate-600">Ortszentrum</span>
          </div>
        </Popup>
      </Marker>

      {/* Traffic Route Markers */}
      {segments.map((segment) => {
        const info = routeInfo[segment.id];
        if (!info) return null;

        const color = TRAFFIC_COLORS[segment.level] || '#64748b';
        const isSelected = selectedRoute === segment.id;
        const style = getTrafficStyle(segment.level);

        return (
          <Marker
            key={segment.id}
            position={[info.lat, info.lng]}
            icon={createCustomIcon(info.icon, color, isSelected)}
            eventHandlers={{
              click: () => onSelectRoute(segment.id),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold text-slate-800">{segment.name}</div>
                <div className="text-xs text-slate-500 mb-2">{info.description}</div>
                <div
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: color + '20', color: color }}
                >
                  {style.label}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <span className="text-slate-500">Distanz:</span>
                    <br />
                    <span className="font-medium">{segment.distance} km</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Geschw.:</span>
                    <br />
                    <span className="font-medium">{segment.speed} km/h</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
