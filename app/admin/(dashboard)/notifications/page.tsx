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

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1)
  const { notifications, totalPages, isLoading, mutate } = useNotifications("admin", page)

  useEffect(() => {
    api
      .patch("/admin/notifications/read-all")
      .then(() => mutate())
      .catch(() => {})
  }, [mutate])

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-xl font-semibold">Notifikasi</h1>
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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="font-medium">Belum ada notifikasi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Notifikasi pesanan baru akan muncul di sini.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Notifikasi</h1>
      <div className="max-w-2xl space-y-2">
        {notifications.map((notif) => (
          <Link
            key={notif.id}
            href={`/admin/orders/${notif.orderId}`}
            className={`block rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
              !notif.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
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
    </div>
  )
}
