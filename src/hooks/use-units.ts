import useSWR from "swr"
import api from "@/lib/api"
import type { Unit } from "@/types"

interface UnitsResponse {
  data: Unit[]
}

export function useAdminUnits() {
  const { data, error, isLoading, mutate } = useSWR<UnitsResponse>(
    "/admin/units",
    async (url: string) => {
      const res = await api.get(url)
      return res.data
    },
  )

  return {
    units: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}
