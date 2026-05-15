import useSWR from "swr"
import { fetcher } from "@/lib/api"
import type { NotificationsResponse } from "@/types"

type NotificationRecipient = "customer" | "admin"

function getUrl(type: NotificationRecipient, page: number): string {
  const base = type === "admin" ? "/admin/notifications" : "/customer/notifications"
  return `${base}?page=${page}`
}

// Full list — loads on demand, revalidates on focus
export function useNotifications(type: NotificationRecipient, page = 1) {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    getUrl(type, page),
    fetcher,
    { revalidateOnFocus: true },
  )

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    isError: !!error,
    mutate,
  }
}

// Unread count only — 30-second polling for badge
// Pass null to skip the request (e.g. when user is not authenticated)
export function useUnreadCount(type: NotificationRecipient | null) {
  const url = type ? getUrl(type, 1) : null
  const { data } = useSWR<NotificationsResponse>(url, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })

  return data?.unreadCount ?? 0
}
