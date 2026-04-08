export interface ShippingArea {
  district: string;
  cost: number;
}

let cachedZones: ShippingArea[] | null = null;

/**
 * Fetches shipping zones from the public API.
 * Results are cached in memory for the session.
 */
export async function fetchShippingZones(): Promise<ShippingArea[]> {
  if (cachedZones) return cachedZones;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${baseUrl}/shipping-zones`);
    const json = await res.json();
    const data: { name: string; cost: number }[] = json.data ?? [];
    cachedZones = data.map((z) => ({ district: z.name, cost: z.cost }));
    return cachedZones;
  } catch {
    return [];
  }
}

/**
 * Match a district name from a full address string.
 * Uses provided zones list (fetched from API).
 */
export function getShippingCostFromZones(
  address: string,
  zones: ShippingArea[],
): { district: string; cost: number } | null {
  if (!address || zones.length === 0) return null;

  const lower = address.toLowerCase();

  for (const area of zones) {
    if (lower.includes(area.district.toLowerCase())) {
      return { district: area.district, cost: area.cost };
    }
  }

  // If address contains "timika" or "mimika" but no district match
  if (lower.includes('timika') || lower.includes('mimika')) {
    // Use the highest cost as fallback
    const maxCost = Math.max(...zones.map((z) => z.cost), 20000);
    return { district: 'Timika (umum)', cost: maxCost };
  }

  return null;
}

/** Returns a hex color based on shipping cost tier */
export function getShippingColor(cost: number): string {
  if (cost <= 0) return '#d1d5db';
  if (cost <= 10000) return '#22c55e';
  if (cost <= 15000) return '#4ade80';
  if (cost <= 20000) return '#facc15';
  if (cost <= 25000) return '#fb923c';
  if (cost <= 30000) return '#f97316';
  return '#ef4444';
}
