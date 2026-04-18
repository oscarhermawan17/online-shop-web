import useSWR from "swr"
import { responseFetcher } from "@/lib/api"
import type { Unit } from "@/types"

interface UnitsResponse {
  data: Unit[]
}

export function useAdminUnits() {
  const { data, error, isLoading, mutate } = useSWR<UnitsResponse>(
    "/admin/units",
    responseFetcher,
  )

  return {
    units: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}
