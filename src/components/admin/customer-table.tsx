"use client"

import {
  MoreHorizontal,
  Loader2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CustomerListItem, PaginationMeta } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"

interface CustomerTableProps {
  customers: CustomerListItem[]
  pagination: PaginationMeta | null
  isLoading: boolean
  searchInput: string
  onSearchChange: (value: string) => void
  status: "" | "active" | "inactive"
  onStatusChange: (value: "" | "active" | "inactive") => void
  limit: number
  onLimitChange: (value: number) => void
  page: number
  onPageChange: (value: number) => void
  onToggleStatus: () => void
}

// ─── Pagination helper ─────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const window = new Set([
    1,
    total,
    current,
    Math.max(2, current - 1),
    Math.min(total - 1, current + 1),
  ])
  const sorted = Array.from(window).sort((a, b) => a - b)

  const result: (number | "...")[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...")
    result.push(sorted[i])
  }
  return result
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function CustomerTable({
  customers,
  pagination,
  isLoading,
  searchInput,
  onSearchChange,
  status,
  onStatusChange,
  limit,
  onLimitChange,
  page,
  onPageChange,
  onToggleStatus,
}: CustomerTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggleStatus = async (customer: CustomerListItem) => {
    const action = customer.isActive ? "Nonaktifkan" : "Aktifkan"
    if (
      !confirm(
        `Yakin ingin ${action.toLowerCase()} pelanggan "${customer.name || customer.phone}"?`,
      )
    )
      return

    setTogglingId(customer.id)
    try {
      await api.patch(`/admin/customers/${customer.id}/toggle-status`)
      toast.success(
        `Pelanggan berhasil di${customer.isActive ? "nonaktifkan" : "aktifkan"}`,
      )
      onToggleStatus()
    } catch (error: unknown) {
      console.error("Toggle status error:", error)
      toast.error("Gagal mengubah status pelanggan")
    } finally {
      setTogglingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const total = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 1
  const startRow = total === 0 ? 0 : (page - 1) * limit + 1
  const endRow = Math.min(page * limit, total)
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="space-y-4">
      {/* ── Controls (above table) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari nama, no. HP, atau email..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 text-base"
          />
        </div>

        {/* Status filter */}
        <Select
          value={status === "" ? "all" : status}
          onValueChange={(value) =>
            onStatusChange(
              value === "all" ? "" : (value as "active" | "inactive"),
            )
          }
        >
          <SelectTrigger className="w-44 h-11! text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="text-base font-semibold py-4 text-foreground">
                Nama
              </TableHead>
              <TableHead className="text-base font-semibold py-4 text-foreground">
                No. HP
              </TableHead>
              <TableHead className="text-base font-semibold py-4 text-foreground hidden md:table-cell">
                Email
              </TableHead>
              <TableHead className="text-base font-semibold py-4 text-foreground">
                Status
              </TableHead>
              <TableHead className="text-base font-semibold py-4 text-foreground hidden md:table-cell">
                Tgl. Daftar
              </TableHead>
              <TableHead className="text-base font-semibold py-4 text-foreground w-16">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Tidak ada pelanggan yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <p className="font-medium">
                      {customer.name || (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{customer.phone}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-muted-foreground">
                      {customer.email || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={customer.isActive ? "default" : "secondary"}
                    >
                      {customer.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={togglingId === customer.id}
                        >
                          {togglingId === customer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(customer)}
                          className={
                            customer.isActive
                              ? "text-destructive focus:text-destructive"
                              : ""
                          }
                        >
                          {customer.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Aktifkan
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer: limit (left) + pagination (right) ── */}
      {pagination && (
        <div className="flex items-center justify-between gap-4">
          {/* Rows per page — left */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Baris per halaman</span>
            <Select
              value={String(limit)}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="whitespace-nowrap hidden sm:inline">
              {total === 0 ? "0" : `${startRow}–${endRow}`} dari {total}{" "}
              pelanggan
            </span>
          </div>

          {/* Pagination — right */}
          <div className="flex items-center gap-1">
            {/* Prev */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-muted-foreground select-none"
                >
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 ${p === page ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                >
                  {p}
                </Button>
              ),
            )}

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
