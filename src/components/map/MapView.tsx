'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { POI } from '@/app/[locale]/map/page';

// Fix for default marker icons in Leaflet with Next.js
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const CATEGORY_COLORS: Record<string, string> = {
  water: '#00d4ff',
  nature: '#10b981',
  building: '#a855f7',
  shopping: '#f59e0b',
  food: '#f43f5e',
  transport: '#71717a',
};

interface MapViewProps {
  pois: POI[];
  onSelectPOI: (poi: POI | null) => void;
  selectedPOI: POI | null;
}

export default function MapView({ pois, onSelectPOI, selectedPOI }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Zernsdorf coordinates (center on Zernsdorfer Lankensee)
    const zernsdorfCenter: [number, number] = [52.2840, 13.6060];

    mapRef.current = L.map(mapContainerRef.current, {
      center: zernsdorfCenter,
      zoom: 15,
      zoomControl: false,
    });

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    // Dark map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when POIs change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    pois.forEach((poi) => {
      const color = CATEGORY_COLORS[poi.category] || '#71717a';
      const icon = createIcon(color);

      const marker = L.marker([poi.lat, poi.lng], { icon })
        .addTo(mapRef.current!)
        .on('click', () => {
          onSelectPOI(poi);
        });

      // Add tooltip
      marker.bindTooltip(poi.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -32],
        className: 'custom-tooltip',
      });

      markersRef.current.push(marker);
    });
  }, [pois, onSelectPOI]);

  // Pan to selected POI
  useEffect(() => {
    if (!mapRef.current || !selectedPOI) return;

    mapRef.current.panTo([selectedPOI.lat, selectedPOI.lng], {
      animate: true,
      duration: 0.5,
    });
  }, [selectedPOI]);

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-tooltip {
          background: rgba(10, 10, 18, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          color: white !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .custom-tooltip::before {
          border-top-color: rgba(10, 10, 18, 0.9) !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(10, 10, 18, 0.9) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(20, 20, 30, 0.95) !important;
        }
        .leaflet-control-zoom-in {
          border-radius: 8px 8px 0 0 !important;
        }
        .leaflet-control-zoom-out {
          border-radius: 0 0 8px 8px !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 10, 18, 0.8) !important;
          color: #71717a !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #00d4ff !important;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ background: '#0a0a12' }}
      />
    </>
  );
}
