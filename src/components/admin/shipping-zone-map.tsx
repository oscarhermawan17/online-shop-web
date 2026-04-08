'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatRupiah } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const MIMIKA_CENTER: [number, number] = [-4.55, 136.89];
const DEFAULT_ZOOM = 9;

export interface ZoneCostMap {
  [districtName: string]: { cost: number; isActive: boolean };
}

interface ShippingZoneMapProps {
  zoneCosts: ZoneCostMap;
  onDistrictClick?: (name: string) => void;
  selectedDistrict?: string | null;
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

function FitBounds({ geojson }: { geojson: GeoJSON.FeatureCollection | null }) {
  const map = useMap();
  useEffect(() => {
    if (geojson) {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, geojson]);
  return null;
}

export default function ShippingZoneMap({
  zoneCosts,
  onDistrictClick,
  selectedDistrict,
}: ShippingZoneMapProps) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/mimika-kecamatan.geojson')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch(() => {});
  }, []);

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

  if (!geojson) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted/50">
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={MIMIKA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={JSON.stringify(zoneCosts) + selectedDistrict}
          data={geojson}
          style={style}
          onEachFeature={onEachFeature}
        />
        <FitBounds geojson={geojson} />
      </MapContainer>
    </div>
  );
}
