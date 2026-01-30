'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Construction } from '@/types';

interface ConstructionsMapProps {
  constructions: Construction[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Zernsdorf Ortsmitte (Friedensaue/Dorfaue) - Quelle: onlinestreet.de
const ZERNSDORF_CENTER = { lat: 52.2992, lng: 13.7002 };

// Farben nach Impact-Level
const IMPACT_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

// Status-Farben
const STATUS_COLORS: Record<string, string> = {
  active: '#ef4444',
  planned: '#f59e0b',
  completed: '#22c55e',
};

// Construction Marker Icon
function createConstructionIcon(status: string, impactLevel: string, isSelected: boolean) {
  const color = STATUS_COLORS[status] || '#64748b';

  return L.divIcon({
    className: 'custom-construction-marker',
    html: `
      <div style="
        width: ${isSelected ? '40px' : '32px'};
        height: ${isSelected ? '40px' : '32px'};
        background-color: ${color};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        border: ${isSelected ? '3px solid #1e293b' : '2px solid white'};
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: all 0.2s;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '20' : '16'}" height="${isSelected ? '20' : '16'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/>
          <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/>
          <path d="M4 15v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3"/>
        </svg>
      </div>
    `,
    iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
  });
}

// Map Controller - fliegt zur ausgewählten Baustelle
function MapController({ selectedConstruction }: { selectedConstruction: Construction | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedConstruction?.coordinates) {
      map.flyTo([selectedConstruction.coordinates.lat, selectedConstruction.coordinates.lng], 14, { duration: 0.5 });
    } else if (selectedConstruction) {
      // Wenn keine Koordinaten, zeige Zernsdorf-Zentrum
      map.flyTo([ZERNSDORF_CENTER.lat, ZERNSDORF_CENTER.lng], 12, { duration: 0.5 });
    }
  }, [selectedConstruction, map]);

  return null;
}

export default function ConstructionsMap({
  constructions,
  selectedId,
  onSelect,
}: ConstructionsMapProps) {
  const selectedConstruction = selectedId
    ? constructions.find(c => c.id === selectedId) || null
    : null;

  // Nur Baustellen mit Koordinaten anzeigen
  const constructionsWithCoords = constructions.filter(c => c.coordinates);

  return (
    <MapContainer
      center={[ZERNSDORF_CENTER.lat, ZERNSDORF_CENTER.lng]}
      zoom={11}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selectedConstruction={selectedConstruction} />

      {/* Zernsdorf Center */}
      <Marker
        position={[ZERNSDORF_CENTER.lat, ZERNSDORF_CENTER.lng]}
        icon={L.divIcon({
          className: 'zernsdorf-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #059669;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })}
      >
        <Popup>
          <strong>Zernsdorf</strong>
        </Popup>
      </Marker>

      {/* Baustellen-Marker */}
      {constructionsWithCoords.map((construction) => {
        const isSelected = selectedId === construction.id;

        return (
          <Marker
            key={construction.id}
            position={[construction.coordinates!.lat, construction.coordinates!.lng]}
            icon={createConstructionIcon(construction.status, construction.impactLevel || 'medium', isSelected)}
            eventHandlers={{
              click: () => onSelect(isSelected ? null : construction.id),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-semibold text-slate-800 mb-1">{construction.title}</div>
                <div className="text-xs text-slate-500 mb-2">{construction.location}</div>
                <div
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2"
                  style={{
                    backgroundColor: STATUS_COLORS[construction.status] + '20',
                    color: STATUS_COLORS[construction.status]
                  }}
                >
                  {construction.status === 'active' ? 'Aktiv' : construction.status === 'planned' ? 'Geplant' : 'Fertig'}
                </div>
                {construction.trafficImpact && (
                  <div className="text-xs text-red-600 font-medium">
                    {construction.trafficImpact}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
