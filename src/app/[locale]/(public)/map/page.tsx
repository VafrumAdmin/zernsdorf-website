'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  MapPin,
  Waves,
  TreePine,
  Home,
  ShoppingBag,
  Utensils,
  Car,
  Filter,
  X,
  Navigation,
} from 'lucide-react';

// Dynamically import the map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a12] flex items-center justify-center">
      <div className="text-[#71717a]">Karte wird geladen...</div>
    </div>
  ),
});

export interface POI {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description?: string;
  icon: string;
}

const POIS: POI[] = [
  // Gewässer
  { id: '1', name: 'Zernsdorfer Lankensee', category: 'water', lat: 52.2820, lng: 13.6050, description: 'Badesee mit Strandbad', icon: 'waves' },
  { id: '2', name: 'Strandbad Lankensee', category: 'water', lat: 52.2835, lng: 13.6020, description: 'Öffentliches Strandbad', icon: 'waves' },

  // Natur
  { id: '3', name: 'Wanderweg Seeufer', category: 'nature', lat: 52.2810, lng: 13.6080, description: 'Rundweg um den See', icon: 'tree' },
  { id: '4', name: 'Waldgebiet Süd', category: 'nature', lat: 52.2780, lng: 13.6100, description: 'Mischwald mit Wanderwegen', icon: 'tree' },

  // Wichtige Orte
  { id: '5', name: 'Bürgerhaus Zernsdorf', category: 'building', lat: 52.2847, lng: 13.6083, description: 'Veranstaltungen & Gemeinde', icon: 'home' },
  { id: '6', name: 'Dorfkirche Zernsdorf', category: 'building', lat: 52.2855, lng: 13.6075, description: 'Historische Kirche', icon: 'home' },

  // Einkaufen
  { id: '7', name: 'REWE', category: 'shopping', lat: 52.2890, lng: 13.6120, description: 'Supermarkt', icon: 'shopping' },
  { id: '8', name: 'Bäckerei Schmidt', category: 'shopping', lat: 52.2852, lng: 13.6090, description: 'Frische Backwaren', icon: 'shopping' },

  // Gastronomie
  { id: '9', name: 'Gasthaus am See', category: 'food', lat: 52.2830, lng: 13.6030, description: 'Regionale Küche', icon: 'food' },
  { id: '10', name: 'Eiscafé Seeterrasse', category: 'food', lat: 52.2838, lng: 13.6025, description: 'Eis & Kaffee', icon: 'food' },

  // Verkehr
  { id: '11', name: 'Bushaltestelle Zernsdorf Mitte', category: 'transport', lat: 52.2850, lng: 13.6085, description: 'Linie 728', icon: 'car' },
  { id: '12', name: 'Parkplatz Strandbad', category: 'transport', lat: 52.2840, lng: 13.6015, description: 'Kostenlos', icon: 'car' },
];

const CATEGORIES = [
  { id: 'water', label: 'Gewässer', icon: Waves, color: '#00d4ff' },
  { id: 'nature', label: 'Natur', icon: TreePine, color: '#10b981' },
  { id: 'building', label: 'Gebäude', icon: Home, color: '#a855f7' },
  { id: 'shopping', label: 'Einkaufen', icon: ShoppingBag, color: '#f59e0b' },
  { id: 'food', label: 'Gastronomie', icon: Utensils, color: '#f43f5e' },
  { id: 'transport', label: 'Verkehr', icon: Car, color: '#71717a' },
];

export default function MapPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredPOIs = POIS.filter((poi) => selectedCategories.includes(poi.category));

  return (
    <div className="h-screen flex flex-col bg-[#050508]">
      {/* Header */}
      <div className="flex-shrink-0 pt-4 pb-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold">
                Interaktive <span className="gradient-text">Dorfkarte</span>
              </h1>
              <p className="text-sm text-[#71717a]">
                {filteredPOIs.length} Orte in Zernsdorf
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-icon ${showFilters ? 'glow-border' : ''}`}
            >
              {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
            </button>
          </motion.div>

          {/* Filter Bar */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {CATEGORIES.map((category) => {
                const isActive = selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                      isActive
                        ? 'bg-white/10 border border-white/20'
                        : 'bg-white/5 border border-transparent opacity-50'
                    }`}
                    style={{
                      borderColor: isActive ? category.color : 'transparent',
                    }}
                  >
                    <category.icon className="w-4 h-4" style={{ color: category.color }} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapComponent pois={filteredPOIs} onSelectPOI={setSelectedPOI} selectedPOI={selectedPOI} />

        {/* POI Detail Card */}
        {selectedPOI && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 glass-card p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold">{selectedPOI.name}</h3>
                <p className="text-sm text-[#71717a]">{selectedPOI.description}</p>
              </div>
              <button
                onClick={() => setSelectedPOI(null)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#71717a]">
              <MapPin className="w-4 h-4" />
              <span>
                {selectedPOI.lat.toFixed(4)}, {selectedPOI.lng.toFixed(4)}
              </span>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPOI.lat},${selectedPOI.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Route planen
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
