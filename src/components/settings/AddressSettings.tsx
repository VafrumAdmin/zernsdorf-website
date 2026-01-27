'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Save,
  X,
  Home,
  Bus,
  Trash2,
  Database,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useUserPreferences, type UserAddress, type NearestStop } from '@/hooks/useUserPreferences';
import { ZERNSDORF_STOPS } from '@/lib/transit';

interface AddressSettingsProps {
  compact?: boolean;
  showStorageOption?: boolean;
  onSaved?: () => void;
}

export function AddressSettings({
  compact = false,
  showStorageOption = true,
  onSaved,
}: AddressSettingsProps) {
  const {
    preferences,
    isLoaded,
    isLoggedIn,
    isSyncing,
    setAddress,
    setNearestStop,
    setStoreDataLocally,
  } = useUserPreferences();

  const [expanded, setExpanded] = useState(!compact);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('15712');
  const [city, setCity] = useState('Zernsdorf');
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [storagePreference, setStoragePreference] = useState<'local' | 'cloud'>('local');

  // Load current values when preferences load
  useEffect(() => {
    if (isLoaded && preferences.address) {
      setStreet(preferences.address.street);
      setHouseNumber(preferences.address.houseNumber);
      setPostalCode(preferences.address.postalCode);
      setCity(preferences.address.city);
    }
    if (isLoaded && preferences.nearestStop) {
      setSelectedStopId(preferences.nearestStop.id);
    }
    if (isLoaded) {
      setStoragePreference(preferences.storeDataLocally ? 'local' : 'cloud');
    }
  }, [isLoaded, preferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save address - auch leere Adresse speichern wenn zuvor eine existierte
      if (street.trim()) {
        const newAddress: UserAddress = {
          street: street.trim(),
          houseNumber: houseNumber.trim(),
          postalCode: postalCode.trim(),
          city: city.trim(),
        };
        await setAddress(newAddress);
      }

      // Save selected stop - unabhängig von Adresse
      if (selectedStopId) {
        const stop = ZERNSDORF_STOPS.find(s => s.id === selectedStopId);
        if (stop) {
          const nearestStop: NearestStop = {
            id: stop.id,
            name: stop.name,
            vbbId: stop.vbbId,
          };
          await setNearestStop(nearestStop);
        }
      }

      // Save storage preference
      if (isLoggedIn) {
        await setStoreDataLocally(storagePreference === 'local');
      }

      setEditMode(false);
      onSaved?.();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAddress = async () => {
    if (confirm('Adresse löschen?')) {
      await setAddress(null);
      setStreet('');
      setHouseNumber('');
      setPostalCode('15712');
      setCity('Zernsdorf');
    }
  };

  const handleClearStop = async () => {
    if (confirm('Haltestelle löschen?')) {
      await setNearestStop(null);
      setSelectedStopId('');
    }
  };

  const handleClearAll = async () => {
    if (confirm('Alle gespeicherten Daten löschen?')) {
      await setAddress(null);
      await setNearestStop(null);
      setStreet('');
      setHouseNumber('');
      setPostalCode('15712');
      setCity('Zernsdorf');
      setSelectedStopId('');
    }
  };

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-32" />
        </div>
      </div>
    );
  }

  const hasData = preferences.address || preferences.nearestStop;

  // Compact mode - just show status
  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">
            {hasData ? 'Standort gespeichert' : 'Standort einrichten'}
          </span>
          {hasData && (
            <CheckCircle size={14} className="text-green-500" />
          )}
        </div>
        <ChevronDown size={18} className="text-slate-400" />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer"
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-emerald-600" />
          <span className="font-medium text-slate-800">Mein Standort</span>
          {hasData && !editMode && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Gespeichert
            </span>
          )}
        </div>
        {compact && (
          <button onClick={() => setExpanded(false)}>
            <ChevronUp size={18} className="text-slate-400" />
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mb-4 text-sm">
          <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-blue-700">
            <p className="mb-1">
              Speichere deine Daten für personalisierte Informationen:
            </p>
            <ul className="text-xs space-y-0.5 ml-2">
              <li>• <strong>Adresse:</strong> Für Müllabfuhrtermine</li>
              <li>• <strong>Haltestelle:</strong> Für Busabfahrten</li>
            </ul>
            <p className="text-xs mt-1 text-blue-600">Du kannst auch nur eines von beiden angeben.</p>
          </div>
        </div>

        {/* Current Status / View Mode */}
        {!editMode && hasData && (
          <div className="space-y-3 mb-4">
            {preferences.address && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <Home size={18} className="text-slate-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Adresse</p>
                  <p className="text-sm text-slate-600">
                    {preferences.address.street} {preferences.address.houseNumber},
                    {' '}{preferences.address.postalCode} {preferences.address.city}
                  </p>
                </div>
                <button
                  onClick={handleClearAddress}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                  title="Adresse löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {preferences.nearestStop && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <Bus size={18} className="text-slate-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Nächste Haltestelle</p>
                  <p className="text-sm text-slate-600">{preferences.nearestStop.name}</p>
                </div>
                <button
                  onClick={handleClearStop}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                  title="Haltestelle löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
              >
                Bearbeiten
              </button>
              {preferences.address && preferences.nearestStop && (
                <button
                  onClick={handleClearAll}
                  className="py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Alles löschen"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Edit Mode / New Entry */}
        {(editMode || !hasData) && (
          <div className="space-y-4">
            {/* Address Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adresse (optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Straße"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Nr."
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  type="text"
                  placeholder="PLZ"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Ort"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Nearest Stop Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nächste Haltestelle
              </label>
              <select
                value={selectedStopId}
                onChange={(e) => setSelectedStopId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Bitte wählen...</option>
                {ZERNSDORF_STOPS.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Storage Option (only for logged in users) */}
            {showStorageOption && isLoggedIn && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wo speichern?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStoragePreference('local')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition ${
                      storagePreference === 'local'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone size={18} className={storagePreference === 'local' ? 'text-emerald-600' : 'text-slate-400'} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Nur hier</p>
                      <p className="text-xs text-slate-500">Lokal im Browser</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoragePreference('cloud')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition ${
                      storagePreference === 'cloud'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Database size={18} className={storagePreference === 'cloud' ? 'text-emerald-600' : 'text-slate-400'} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">In der Cloud</p>
                      <p className="text-xs text-slate-500">Geräteübergreifend</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || isSyncing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {saving || isSyncing ? (
                  <span className="animate-spin">...</span>
                ) : (
                  <Save size={16} />
                )}
                Speichern
              </button>
              {editMode && (
                <button
                  onClick={() => setEditMode(false)}
                  className="py-2.5 px-4 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Not logged in info */}
        {!isLoggedIn && showStorageOption && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm">
            <p className="text-amber-700">
              <strong>Tipp:</strong> Mit einem Account kannst du deine Einstellungen geräteübergreifend speichern.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddressSettings;
