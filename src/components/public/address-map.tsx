'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON as GeoJSONLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { fetchShippingZones, getShippingColor, type ShippingArea } from '@/lib/shipping';
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
  showShippingZones?: boolean;
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

function ShippingZonesGeoJSON({ zones }: { zones: ShippingArea[] }) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/mimika-kecamatan.geojson')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch(() => {});
  }, []);

  const zoneMap = useCallback(() => {
    const map: Record<string, number> = {};
    for (const z of zones) map[z.district] = z.cost;
    return map;
  }, [zones]);

  const style = useCallback(
    (feature: GeoJSON.Feature | undefined) => {
      const name = feature?.properties?.name || '';
      const cost = zoneMap()[name] ?? 0;
      const color = getShippingColor(cost);
      return {
        fillColor: color,
        fillOpacity: 0.3,
        color,
        weight: 2,
      };
    },
    [zoneMap],
  );

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const name = feature.properties?.name || '';
      const cost = zoneMap()[name] ?? 0;
      layer.bindTooltip(
        `<div style="text-align:center">
          <strong>${name}</strong><br/>
          ${cost > 0 ? formatRupiah(cost) : '<span style="color:#9ca3af">Belum diatur</span>'}
        </div>`,
        { sticky: true, direction: 'top' },
      );
    },
    [zoneMap],
  );

  if (!geojson || zones.length === 0) return null;

  return (
    <GeoJSONLayer
      key={JSON.stringify(zones)}
      data={geojson}
      style={style}
      onEachFeature={onEachFeature}
    />
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

export default function AddressMap({ address, onAddressFound, showShippingZones = true }: AddressMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [zones, setZones] = useState<ShippingArea[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextGeocode = useRef(false);

  // Fetch shipping zones from API
  useEffect(() => {
    if (showShippingZones) {
      fetchShippingZones().then(setZones);
    }
  }, [showShippingZones]);

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
          {showShippingZones && <ShippingZonesGeoJSON zones={zones} />}
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
      </div>
      <p className="text-xs text-muted-foreground">
        Klik peta atau geser pin untuk menentukan lokasi.{showShippingZones ? ' Hover area untuk lihat ongkir.' : ''}
      </p>
    </div>
  );
}
