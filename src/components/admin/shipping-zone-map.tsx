'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatRupiah } from '@/lib/utils';

const GOOGLE_ROAD_TILE_URL = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
const GOOGLE_SUBDOMAINS = ['mt0', 'mt1', 'mt2', 'mt3'];

const MIMIKA_CENTER: [number, number] = [-4.55, 136.89];
const DEFAULT_ZOOM = 9;

export interface ZoneCostMap {
  [districtName: string]: { cost: number; isActive: boolean };
}

interface ShippingZoneMapProps {
  zoneCosts: ZoneCostMap;
  onDistrictClick?: (name: string) => void;
  selectedDistrict?: string | null;
  preloadedGeojson?: GeoJSON.FeatureCollection | null;
}

function getColor(cost: number, isActive: boolean): string {
  if (!isActive) return '#9ca3af'; // gray
  if (cost <= 0) return '#d1d5db'; // not set
  if (cost <= 10000) return '#22c55e';
  if (cost <= 15000) return '#4ade80';
  if (cost <= 20000) return '#facc15';
  if (cost <= 25000) return '#fb923c';
  if (cost <= 30000) return '#f97316';
  return '#ef4444';
}

function FitBounds({ geoJsonRef }: { geoJsonRef: React.RefObject<L.GeoJSON | null> }) {
  const map = useMap();
  useEffect(() => {
    const layer = geoJsonRef.current;
    if (layer) {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, geoJsonRef]);
  return null;
}

// Module-level cache so the GeoJSON is fetched once and shared across mounts
let geojsonCache: GeoJSON.FeatureCollection | null = null;
let geojsonPromise: Promise<GeoJSON.FeatureCollection> | null = null;

export function preloadGeojson(): Promise<GeoJSON.FeatureCollection> {
  if (geojsonCache) return Promise.resolve(geojsonCache);
  if (!geojsonPromise) {
    geojsonPromise = fetch('/mimika-kecamatan.geojson')
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        geojsonCache = data;
        return data;
      });
  }
  return geojsonPromise;
}

export default function ShippingZoneMap({
  zoneCosts,
  onDistrictClick,
  selectedDistrict,
  preloadedGeojson,
}: ShippingZoneMapProps) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(
    preloadedGeojson ?? geojsonCache,
  );

  useEffect(() => {
    if (!geojson) {
      preloadGeojson().then(setGeojson).catch(() => {});
    }
  }, [geojson]);

  const style = useCallback(
    (feature: GeoJSON.Feature | undefined) => {
      const name = feature?.properties?.name || '';
      const zone = zoneCosts[name];
      const cost = zone?.cost ?? 0;
      const isActive = zone?.isActive ?? true;
      const isSelected = name === selectedDistrict;

      return {
        fillColor: getColor(cost, isActive),
        fillOpacity: isSelected ? 0.6 : 0.35,
        color: isSelected ? '#1e40af' : '#374151',
        weight: isSelected ? 3 : 1.5,
      };
    },
    [zoneCosts, selectedDistrict],
  );

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const name = feature.properties?.name || '';
      const zone = zoneCosts[name];
      const cost = zone?.cost ?? 0;
      const isActive = zone?.isActive ?? true;

      layer.bindTooltip(
        `<div style="text-align:center">
          <strong>${name}</strong><br/>
          ${!isActive ? '<span style="color:#9ca3af">Nonaktif</span>' : cost > 0 ? formatRupiah(cost) : '<span style="color:#9ca3af">Belum diatur</span>'}
        </div>`,
        { sticky: true, direction: 'top' },
      );

      (layer as L.Path).on('click', () => {
        onDistrictClick?.(name);
      });
    },
    [zoneCosts, onDistrictClick],
  );

  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Update styles and tooltips imperatively without remounting
  useEffect(() => {
    const layer = geoJsonRef.current;
    if (!layer) return;
    layer.eachLayer((l) => {
      const feature = (l as unknown as { feature: GeoJSON.Feature }).feature;
      if (feature) {
        (l as L.Path).setStyle(style(feature));
        const name = feature.properties?.name || '';
        const zone = zoneCosts[name];
        const cost = zone?.cost ?? 0;
        const isActive = zone?.isActive ?? true;
        l.unbindTooltip();
        l.bindTooltip(
          `<div style="text-align:center">
            <strong>${name}</strong><br/>
            ${!isActive ? '<span style="color:#9ca3af">Nonaktif</span>' : cost > 0 ? formatRupiah(cost) : '<span style="color:#9ca3af">Belum diatur</span>'}
          </div>`,
          { sticky: true, direction: 'top' },
        );
      }
    });
  }, [zoneCosts, selectedDistrict, style]);

  if (!geojson) {
    return (
      <div className="flex h-125 items-center justify-center rounded-lg border bg-muted/50">
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    );
  }

  return (
    <div className="relative z-0 overflow-hidden rounded-lg border">
      <MapContainer
        className="z-0"
        center={MIMIKA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        preferCanvas
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; Google'
          url={GOOGLE_ROAD_TILE_URL}
          subdomains={GOOGLE_SUBDOMAINS}
          maxZoom={20}
        />
        <GeoJSON
          ref={geoJsonRef}
          data={geojson}
          style={style}
          onEachFeature={onEachFeature}
        />
        <FitBounds geoJsonRef={geoJsonRef} />
      </MapContainer>
    </div>
  );
}
