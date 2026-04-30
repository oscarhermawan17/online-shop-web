import type { Store } from "@/types"

type StoreInfo = { name: string; description?: string; address?: string }

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
    }
  } catch {
    return FALLBACK
  }
}
