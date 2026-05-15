import type { Store } from "@/types"

type StoreInfo = {
  name: string
  description?: string
  address?: string
  logoUrl?: string
  bankAccounts?: Store["bankAccounts"]
  qrisImageUrl?: string
  whatsappNumber?: string
  instagramUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
}

const FALLBACK: StoreInfo = { name: "Toko Kami" }

export async function getStoreInfo(): Promise<StoreInfo> {
  const baseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return FALLBACK

  try {
    const res = await fetch(`${baseUrl}/store`, { cache: "no-store" })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const json = await res.json()
    // handles { data: Store } or bare Store shapes
    const data: Store = json.data ?? json
    if (!data?.name) throw new Error("missing name")
    return {
      name: data.name,
      description: data.description ?? undefined,
      address: data.address ?? undefined,
      logoUrl: data.logoUrl ?? undefined,
      bankAccounts: data.bankAccounts ?? [],
      qrisImageUrl: data.qrisImageUrl ?? undefined,
      whatsappNumber: data.whatsappNumber ?? undefined,
      instagramUrl: data.instagramUrl ?? undefined,
      tiktokUrl: data.tiktokUrl ?? undefined,
      youtubeUrl: data.youtubeUrl ?? undefined,
    }
  } catch {
    return FALLBACK
  }
}
