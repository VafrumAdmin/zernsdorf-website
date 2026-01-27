'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface WalkingRouteMapProps {
  coordinates: [number, number][]; // [lng, lat] pairs from OSRM
  fromName: string;
  toName: string;
  height?: string;
}

export default function WalkingRouteMap({
  coordinates,
  fromName,
  toName,
  height = '300px',
}: WalkingRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !coordinates || coordinates.length < 2) return;

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Convert [lng, lat] to [lat, lng] for Leaflet
    const latLngs: [number, number][] = coordinates.map(([lng, lat]) => [lat, lng]);

    // Create map
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Custom icons
    const startIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 32px;
        height: 32px;
        background: #22c55e;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">A</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const endIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 32px;
        height: 32px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">B</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Draw the route
    const routeLine = L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.8,
    }).addTo(map);

    // Add start marker
    const startMarker = L.marker(latLngs[0], { icon: startIcon })
      .bindPopup(`<strong>Start:</strong><br>${fromName || 'Ihr Standort'}`)
      .addTo(map);

    // Add end marker
    const endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
      .bindPopup(`<strong>Ziel:</strong><br>${toName || 'Ziel'}`)
      .addTo(map);

    // Fit bounds to show entire route
    const bounds = routeLine.getBounds();
    map.fitBounds(bounds, { padding: [30, 30] });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, fromName, toName]);

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return (
    <div className="print-map-wrapper" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <div className="rounded-xl overflow-hidden border-2 border-blue-200">
        <div ref={mapRef} style={{ height, width: '100%' }} />
        <div className="p-3 bg-white border-t border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">A</div>
              <span className="text-slate-700">{fromName?.split(',')[0] || 'Start'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">B</div>
              <span className="text-slate-700">{toName?.split(',')[0] || 'Ziel'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
