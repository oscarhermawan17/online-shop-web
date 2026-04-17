'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminShippingZones } from '@/hooks';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { ZoneCostMap } from '@/components/admin/shipping-zone-map';
import { preloadGeojson } from '@/components/admin/shipping-zone-map';

const ShippingZoneMap = dynamic(
  () => import('@/components/admin/shipping-zone-map'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted/50">
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    ),
  },
);

// Start fetching GeoJSON in parallel with the dynamic import
if (typeof window !== 'undefined') {
  preloadGeojson();
}

// All kecamatan names from the GeoJSON
const ALL_DISTRICTS = [
  'Agimuga',
  'Jila',
  'Jita',
  'Kualakencana',
  'Kwamkinarama',
  'Mimika Barat',
  'Mimika Barat Jauh',
  'Mimika Barat Tengah',
  'Mimika Baru',
  'Mimika Timur',
  'Mimika Timur Jauh',
  'Mimika Timur Tengah',
  'Tembagapura',
];

export default function ShippingZonesPage() {
  const { zones, isLoading, isError, mutate } = useAdminShippingZones();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [localCosts, setLocalCosts] = useState<ZoneCostMap>({});

  // Initialize localCosts from server data
  useEffect(() => {
    const map: ZoneCostMap = {};
    for (const name of ALL_DISTRICTS) {
      const existing = zones.find((z) => z.name === name);
      map[name] = {
        cost: existing?.cost ?? 0,
        isActive: existing?.isActive ?? true,
      };
    }
    setLocalCosts(map);
  }, [zones]);

  const updateCost = useCallback((name: string, cost: number) => {
    setLocalCosts((prev) => ({
      ...prev,
      [name]: { ...prev[name], cost: Math.max(0, cost) },
    }));
  }, []);

  const toggleActive = useCallback((name: string) => {
    setLocalCosts((prev) => ({
      ...prev,
      [name]: { ...prev[name], isActive: !prev[name]?.isActive },
    }));
  }, []);

  const hasChanges = useMemo(() => {
    for (const name of ALL_DISTRICTS) {
      const local = localCosts[name];
      const server = zones.find((z) => z.name === name);
      if (!local) continue;
      if (!server && local.cost > 0) return true;
      if (server && (server.cost !== local.cost || server.isActive !== local.isActive)) return true;
    }
    return false;
  }, [localCosts, zones]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = ALL_DISTRICTS
        .filter((name) => localCosts[name]?.cost > 0)
        .map((name) => ({
          name,
          cost: localCosts[name].cost,
          isActive: localCosts[name].isActive,
        }));

      await api.put('/admin/shipping-zones', { zones: payload });
      toast.success('Area pengiriman berhasil disimpan');
      mutate();
    } catch (error: unknown) {
      console.error('Save shipping zones error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan area pengiriman');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingPage />;
  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Data"
        message="Tidak dapat memuat area pengiriman"
        onRetry={() => mutate()}
      />
    );
  }

  const selected = selectedDistrict ? localCosts[selectedDistrict] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Area Pengiriman</h1>
          <p className="text-muted-foreground">
            Atur ongkos kirim per kecamatan. Klik area di peta untuk mengatur.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <ShippingZoneMap
            zoneCosts={localCosts}
            onDistrictClick={setSelectedDistrict}
            selectedDistrict={selectedDistrict}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Klik kecamatan di peta untuk mengatur ongkos kirim. Hover untuk lihat info.
          </p>
        </div>

        {/* Cost Editor */}
        <div className="space-y-4">
          {/* Selected district editor */}
          {selectedDistrict && selected && (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{selectedDistrict}</CardTitle>
                <CardDescription>Atur ongkos kirim area ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ongkos Kirim</Label>
                  <CurrencyInput
                    inputMode="numeric"
                    placeholder="0"
                    value={selected.cost > 0 ? selected.cost : null}
                    onValueChange={(v) =>
                      selectedDistrict && updateCost(selectedDistrict, v ?? 0)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Aktif</Label>
                  <Switch
                    checked={selected.isActive}
                    onCheckedChange={() => toggleActive(selectedDistrict)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* All districts list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Semua Kecamatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] space-y-1 overflow-y-auto">
                {ALL_DISTRICTS.map((name) => {
                  const zone = localCosts[name];
                  const cost = zone?.cost ?? 0;
                  const isActive = zone?.isActive ?? true;
                  const isSelected = name === selectedDistrict;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedDistrict(name)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'hover:bg-muted'
                      } ${!isActive ? 'opacity-50' : ''}`}
                    >
                      <span>{name}</span>
                      <span className={cost > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {cost > 0 ? formatRupiah(cost) : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
