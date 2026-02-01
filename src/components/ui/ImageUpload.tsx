'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  type: 'logo' | 'image';
  businessId?: string;
  currentImage?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  label?: string;
}

export function ImageUpload({
  type,
  businessId,
  currentImage,
  onUpload,
  onRemove,
  className = '',
  label
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP, GIF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Datei zu groß. Maximum: 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    // Zeige lokale Vorschau
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (businessId) {
        formData.append('businessId', businessId);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      setPreview(data.url);
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isLogo = type === 'logo';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className={`relative ${isLogo ? 'w-32 h-32' : 'w-full aspect-video'} rounded-lg overflow-hidden border border-slate-200`}>
          <img
            src={preview}
            alt="Vorschau"
            className="w-full h-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRemove(); }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); inputRef.current?.click(); }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={uploading}
          className={`${isLogo ? 'w-32 h-32' : 'w-full aspect-video'} border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition flex flex-col items-center justify-center gap-2 text-slate-500`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              {isLogo ? <ImageIcon size={32} /> : <Upload size={32} />}
              <span className="text-sm">
                {isLogo ? 'Logo hochladen' : 'Bild hochladen'}
              </span>
              <span className="text-xs text-slate-400">
                Max. 5MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Komponente für mehrere Bilder
interface MultiImageUploadProps {
  businessId?: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  label?: string;
}

export function MultiImageUpload({
  businessId,
  images,
  onImagesChange,
  maxImages = 5,
  className = '',
  label
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(`Maximal ${maxImages} Bilder erlaubt`);
      return;
    }

    setError(null);
    setUploading(true);

    const newImages: string[] = [];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];

      // Validierung
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) continue;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');
        if (businessId) {
          formData.append('businessId', businessId);
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (res.ok) {
          newImages.push(data.url);
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    setUploading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label} ({images.length}/{maxImages})
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || images.length >= maxImages}
      />

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
            <img src={url} alt={`Bild ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRemove(index); }}
              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); inputRef.current?.click(); }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition flex flex-col items-center justify-center gap-1 text-slate-500"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload size={20} />
                <span className="text-xs">Hinzufügen</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
