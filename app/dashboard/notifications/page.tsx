"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, ChevronLeft, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"

const formatRelativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "Baru saja"
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const { notifications, totalPages, isLoading, mutate } = useNotifications("customer", page)

  useEffect(() => {
    api
      .patch("/customer/notifications/read-all")
      .then(() => mutate())
      .catch(() => {})
  }, [mutate])

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 pb-24 pt-4 md:px-0 md:pb-0 md:pt-0">
        <h1 className="text-lg font-semibold">Notifikasi</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="px-4 pb-24 pt-4 md:px-0 md:pb-0 md:pt-0">
        <h1 className="mb-6 text-lg font-semibold">Notifikasi</h1>
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="font-medium">Belum ada notifikasi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Notifikasi pesanan akan muncul di sini.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 pb-24 pt-4 md:px-0 md:pb-0 md:pt-0">
      <h1 className="text-lg font-semibold">Notifikasi</h1>
      <div className="space-y-2">
        {notifications.map((notif) => (
          <Link
            key={notif.id}
            href={`/order/${notif.order.publicOrderId}`}
            className={`block rounded-lg border bg-white p-4 transition-colors hover:bg-muted/50 ${
              !notif.isRead ? "border-l-4 border-l-primary" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm leading-snug">{notif.message}</p>
              {!notif.isRead && (
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeTime(notif.updatedAt)}
            </p>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
