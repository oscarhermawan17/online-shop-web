'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { getShippingAreas, getShippingColor } from '@/lib/shipping';
import { formatRupiah } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Default center: Timika, Papua
const DEFAULT_CENTER: [number, number] = [-4.530, 136.890];
const DEFAULT_ZOOM = 11;
const LOCATED_ZOOM = 15;

interface AddressMapProps {
  address: string;
  onAddressFound?: (address: string) => void;
}

function RecenterMap({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom ?? LOCATED_ZOOM);
  }, [map, lat, lng, zoom]);
  return null;
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      onDragEnd(lat, lng);
    }
  }, [onDragEnd]);

  return (
    <Marker
      position={position}
      icon={markerIcon}
      draggable
      ref={markerRef}
      eventHandlers={{ dragend: handleDragEnd }}
    />
  );
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ShippingZones() {
  const areas = getShippingAreas();

  return (
    <>
      {areas.map((area) => {
        const color = getShippingColor(area.cost);
        return (
          <Polygon
            key={area.district}
            positions={area.polygon}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.25,
              weight: 2,
            }}
          >
            <Tooltip sticky direction="center" className="shipping-zone-tooltip">
              <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>
                {area.district}
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px' }}>
                {formatRupiah(area.cost)}
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'id' } }
    );
    const data = await res.json();
    return data?.display_name || null;
  } catch {
    return null;
  }
}

async function forwardGeocode(address: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'Accept-Language': 'id' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch {
    return null;
  }
}

export default function AddressMap({ address, onAddressFound }: AddressMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextGeocode = useRef(false);

  // Forward geocode when user types address
  useEffect(() => {
    if (skipNextGeocode.current) {
      skipNextGeocode.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!address || address.length < 10) return;

    debounceRef.current = setTimeout(async () => {
      const result = await forwardGeocode(address);
      if (result) setPosition(result);
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address]);

  const handleMapInteraction = useCallback(
    async (lat: number, lng: number) => {
      setPosition([lat, lng]);
      const addr = await reverseGeocode(lat, lng);
      if (addr && onAddressFound) {
        skipNextGeocode.current = true;
        onAddressFound(addr);
      }
    },
    [onAddressFound]
  );

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await handleMapInteraction(lat, lng);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [handleMapInteraction]);

  const center = position || DEFAULT_CENTER;
  const zoom = position ? LOCATED_ZOOM : DEFAULT_ZOOM;

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: '300px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ShippingZones />
          {position && (
            <>
              <DraggableMarker position={position} onDragEnd={handleMapInteraction} />
              <RecenterMap lat={position[0]} lng={position[1]} zoom={zoom} />
            </>
          )}
          <MapClickHandler onClick={handleMapInteraction} />
        </MapContainer>

        {/* Locate me button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-md transition-colors hover:bg-accent"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? 'Mencari...' : 'Lokasi Saya'}
        </button>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border bg-background/90 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
          <p className="mb-1.5 font-semibold">Ongkir</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
              <span>Rp 8rb - 12rb</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#fb923c' }} />
              <span>Rp 14rb - 18rb</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
              <span>Rp 20rb - 25rb</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Klik peta atau geser pin untuk menentukan lokasi. Hover area untuk lihat ongkir.
      </p>
    </div>
  );
}
