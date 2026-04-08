export interface ShippingArea {
  district: string;
  cost: number;
  polygon: [number, number][];
}

// Dummy shipping rates for Timika, Papua (Kabupaten Mimika)
// Toko diasumsikan berada di Kec. Mimika Baru (pusat kota Timika)
const SHIPPING_AREAS: ShippingArea[] = [
  // === Dekat (pusat kota) ===
  {
    district: 'Mimika Baru',
    cost: 8000,
    polygon: [
      [-4.535, 136.870],
      [-4.535, 136.905],
      [-4.550, 136.915],
      [-4.565, 136.905],
      [-4.565, 136.870],
      [-4.550, 136.860],
    ],
  },
  {
    district: 'Kwamki Narama',
    cost: 10000,
    polygon: [
      [-4.530, 136.905],
      [-4.530, 136.940],
      [-4.550, 136.950],
      [-4.570, 136.940],
      [-4.565, 136.905],
      [-4.550, 136.915],
    ],
  },
  {
    district: 'Wania',
    cost: 10000,
    polygon: [
      [-4.565, 136.860],
      [-4.565, 136.905],
      [-4.570, 136.940],
      [-4.590, 136.935],
      [-4.600, 136.900],
      [-4.595, 136.860],
      [-4.580, 136.850],
    ],
  },
  {
    district: 'Kuala Kencana',
    cost: 12000,
    polygon: [
      [-4.480, 136.850],
      [-4.480, 136.895],
      [-4.505, 136.910],
      [-4.530, 136.905],
      [-4.535, 136.870],
      [-4.530, 136.850],
      [-4.510, 136.840],
    ],
  },

  // === Sedang ===
  {
    district: 'Mimika Timur',
    cost: 15000,
    polygon: [
      [-4.530, 136.940],
      [-4.520, 136.980],
      [-4.540, 137.020],
      [-4.570, 137.020],
      [-4.590, 136.990],
      [-4.590, 136.935],
      [-4.570, 136.940],
      [-4.550, 136.950],
    ],
  },
  {
    district: 'Iwaka',
    cost: 15000,
    polygon: [
      [-4.595, 136.860],
      [-4.600, 136.900],
      [-4.590, 136.935],
      [-4.590, 136.990],
      [-4.620, 136.980],
      [-4.640, 136.930],
      [-4.635, 136.870],
      [-4.615, 136.850],
    ],
  },
  {
    district: 'Mimika Barat',
    cost: 14000,
    polygon: [
      [-4.510, 136.800],
      [-4.510, 136.840],
      [-4.530, 136.850],
      [-4.535, 136.870],
      [-4.550, 136.860],
      [-4.580, 136.850],
      [-4.580, 136.810],
      [-4.550, 136.790],
    ],
  },

  // === Agak jauh ===
  {
    district: 'Tembagapura',
    cost: 25000,
    polygon: [
      [-4.380, 136.870],
      [-4.380, 136.940],
      [-4.420, 136.960],
      [-4.450, 136.940],
      [-4.470, 136.900],
      [-4.460, 136.860],
      [-4.430, 136.845],
      [-4.400, 136.855],
    ],
  },
  {
    district: 'Jila',
    cost: 20000,
    polygon: [
      [-4.450, 136.940],
      [-4.450, 136.990],
      [-4.480, 137.010],
      [-4.510, 136.995],
      [-4.520, 136.960],
      [-4.520, 136.940],
      [-4.505, 136.910],
      [-4.480, 136.895],
      [-4.470, 136.900],
    ],
  },
  {
    district: 'Jita',
    cost: 20000,
    polygon: [
      [-4.460, 136.790],
      [-4.460, 136.860],
      [-4.430, 136.845],
      [-4.400, 136.855],
      [-4.380, 136.830],
      [-4.390, 136.790],
      [-4.420, 136.775],
    ],
  },
  {
    district: 'Hoya',
    cost: 22000,
    polygon: [
      [-4.520, 136.740],
      [-4.520, 136.800],
      [-4.550, 136.790],
      [-4.580, 136.810],
      [-4.610, 136.800],
      [-4.610, 136.750],
      [-4.580, 136.730],
      [-4.550, 136.730],
    ],
  },
  {
    district: 'Agimuga',
    cost: 25000,
    polygon: [
      [-4.350, 136.780],
      [-4.350, 136.830],
      [-4.380, 136.830],
      [-4.390, 136.790],
      [-4.380, 136.760],
      [-4.360, 136.760],
    ],
  },
  {
    district: 'Alama',
    cost: 22000,
    polygon: [
      [-4.380, 136.940],
      [-4.380, 136.990],
      [-4.410, 137.010],
      [-4.440, 137.000],
      [-4.450, 136.990],
      [-4.450, 136.940],
      [-4.420, 136.960],
    ],
  },
  {
    district: 'Amar',
    cost: 18000,
    polygon: [
      [-4.460, 136.860],
      [-4.480, 136.850],
      [-4.510, 136.840],
      [-4.510, 136.800],
      [-4.520, 136.800],
      [-4.520, 136.740],
      [-4.490, 136.740],
      [-4.460, 136.790],
    ],
  },
];

const DEFAULT_COST = 20000;

/**
 * Match a district name from a full address string.
 * Tries to find a known kecamatan in the address text (case-insensitive).
 */
export function getShippingCost(address: string): { district: string; cost: number } | null {
  if (!address) return null;

  const lower = address.toLowerCase();

  for (const area of SHIPPING_AREAS) {
    if (lower.includes(area.district.toLowerCase())) {
      return { district: area.district, cost: area.cost };
    }
  }

  // If address contains "timika" or "mimika" but no district match, use default
  if (lower.includes('timika') || lower.includes('mimika')) {
    return { district: 'Timika (umum)', cost: DEFAULT_COST };
  }

  // Outside area — not supported
  return null;
}

export function getShippingAreas(): ShippingArea[] {
  return SHIPPING_AREAS;
}

/** Returns a hex color based on shipping cost tier */
export function getShippingColor(cost: number): string {
  if (cost <= 8000) return '#22c55e';   // green  — sangat dekat
  if (cost <= 10000) return '#4ade80';  // light green
  if (cost <= 12000) return '#facc15';  // yellow
  if (cost <= 15000) return '#fb923c';  // orange
  if (cost <= 18000) return '#f97316';  // dark orange
  if (cost <= 22000) return '#ef4444';  // red
  return '#dc2626';                      // dark red — jauh/pegunungan
}
