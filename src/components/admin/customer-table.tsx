"use client"

import {
  MoreHorizontal,
  Loader2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react"
import { useMemo, useState } from "react"
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
  status: "all" | "active" | "inactive"
  onStatusChangeFilter: (value: "all" | "active" | "inactive") => void
  onStatusChange: () => void
  limit: number
  onLimitChange: (value: number) => void
  page: number
  onPageChange: (value: number) => void
  onToggleStatus: () => void
}

type SortField = "name" | "phone" | "email" | "type" | "status" | "createdAt"
type SortDirection = "asc" | "desc"

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
  onStatusChangeFilter,
  onStatusChange,
  limit,
  onLimitChange,
  page,
  onPageChange,
  onToggleStatus,
}: CustomerTableProps) {
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [phoneFilter, setPhoneFilter] = useState("")
  const [emailFilter, setEmailFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "wholesale" | "base">("all")
  const [createdDateFilter, setCreatedDateFilter] = useState("")

  const handleToggleStatus = async (customer: CustomerListItem) => {
    const action = customer.isActive ? "Nonaktifkan" : "Aktifkan"
    if (
      !confirm(
        `Yakin ingin ${action.toLowerCase()} pelanggan "${customer.name || customer.phone}"?`,
      )
    ) {
      return
    }

    setLoadingActionId(customer.id)
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
      setLoadingActionId(null)
    }
  }

  const handleChangeType = async (customer: CustomerListItem) => {
    const nextType = customer.type === 'wholesale' ? 'base' : 'wholesale';
    const nextTypeLabel = nextType === 'wholesale' ? 'Toko' : 'Retail';
    if (!confirm(`Ubah kategori "${customer.name || customer.phone}" menjadi customer ${nextTypeLabel}?`)) return;

    setLoadingActionId(customer.id)
    try {
      await api.patch(`/admin/customers/${customer.id}/type`, { type: nextType })
      toast.success(`Kategori pelanggan berhasil diubah menjadi customer ${nextTypeLabel}`)
      onStatusChange()
    } catch (error: unknown) {
      console.error("Change type error:", error)
      toast.error("Gagal mengubah kategori pelanggan")
    } finally {
      setLoadingActionId(null)
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

  const toDateInputValue = (dateStr: string) => {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) {
      return ""
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const filteredCustomers = useMemo(() => {
    const nameQuery = searchInput.trim().toLowerCase()
    const phoneQuery = phoneFilter.trim().toLowerCase()
    const emailQuery = emailFilter.trim().toLowerCase()

    return customers.filter((customer) => {
      const nameValue = (customer.name ?? "").toLowerCase()
      const phoneValue = (customer.phone ?? "").toLowerCase()
      const emailValue = (customer.email ?? "").toLowerCase()

      if (nameQuery && !nameValue.includes(nameQuery)) {
        return false
      }

      if (phoneQuery && !phoneValue.includes(phoneQuery)) {
        return false
      }

      if (emailQuery && !emailValue.includes(emailQuery)) {
        return false
      }

      if (typeFilter !== "all" && customer.type !== typeFilter) {
        return false
      }

      if (status === "active" && !customer.isActive) {
        return false
      }

      if (status === "inactive" && customer.isActive) {
        return false
      }

      if (createdDateFilter && toDateInputValue(customer.createdAt) !== createdDateFilter) {
        return false
      }

      return true
    })
  }, [customers, createdDateFilter, emailFilter, phoneFilter, searchInput, status, typeFilter])

  const sortedCustomers = useMemo(() => {
    const getSortValue = (customer: CustomerListItem) => {
      switch (sortField) {
        case "name":
          return (customer.name ?? "").toLowerCase()
        case "phone":
          return customer.phone
        case "email":
          return (customer.email ?? "").toLowerCase()
        case "type":
          return customer.type === "wholesale" ? 1 : 0
        case "status":
          return customer.isActive ? 1 : 0
        case "createdAt":
          return new Date(customer.createdAt).getTime()
        default:
          return ""
      }
    }

    return [...filteredCustomers].sort((a, b) => {
      const aValue = getSortValue(a)
      const bValue = getSortValue(b)

      let result = 0
      if (typeof aValue === "number" && typeof bValue === "number") {
        result = aValue - bValue
      } else {
        result = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === "asc" ? result : -result
    })
  }, [filteredCustomers, sortField, sortDirection])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortField(field)
    setSortDirection("asc")
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    }

    if (sortDirection === "asc") {
      return <ArrowUp className="h-3.5 w-3.5" />
    }

    return <ArrowDown className="h-3.5 w-3.5" />
  }

  const clearFilters = () => {
    onSearchChange("")
    onStatusChangeFilter("all")
    setPhoneFilter("")
    setEmailFilter("")
    setTypeFilter("all")
    setCreatedDateFilter("")
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Menampilkan {sortedCustomers.length} dari {customers.length} pelanggan
      </p>

      {/* ── Table ── */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort("name")}>
                  Nama
                  <SortIcon field="name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort("phone")}>
                  No. HP
                  <SortIcon field="phone" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort("email")}>
                  Email
                  <SortIcon field="email" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort("type")}>
                  Kategori
                  <SortIcon field="type" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort("status")}>
                  Status
                  <SortIcon field="status" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort("createdAt")}>
                  Tgl. Daftar
                  <SortIcon field="createdAt" />
                </Button>
              </TableHead>
              <TableHead className="w-16">Aksi</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>
                <Input
                  placeholder="Filter nama"
                  value={searchInput}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-8"
                />
              </TableHead>
              <TableHead>
                <Input
                  placeholder="Filter no. HP"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="h-8"
                />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Input
                  placeholder="Filter email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="h-8"
                />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Select
                  value={typeFilter}
                  onValueChange={(value: "all" | "wholesale" | "base") => setTypeFilter(value)}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua kategori</SelectItem>
                    <SelectItem value="wholesale">Toko</SelectItem>
                    <SelectItem value="base">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead>
                <Select
                  value={status}
                  onValueChange={(value: "all" | "active" | "inactive") =>
                    onStatusChangeFilter(value)
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Input
                  type="date"
                  value={createdDateFilter}
                  onChange={(e) => setCreatedDateFilter(e.target.value)}
                  className="h-8"
                />
              </TableHead>
              <TableHead className="w-16">
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearFilters}>
                  Reset
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  Tidak ada pelanggan yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              sortedCustomers.map((customer) => (
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

                   {/* <TableCell className="hidden md:table-cell">
                    <Badge variant={customer.type === 'wholesale' ? 'default' : 'outline'}>
                      {customer.type === 'wholesale' ? 'Wholesale' : 'Base'}
                    </Badge>
                  </TableCell> */}

                  <TableCell className="hidden md:table-cell">
                    <Badge variant={customer.type === 'wholesale' ? 'default' : 'outline'}>
                      {customer.type === 'wholesale' ? 'Toko' : 'Retail'}
                    </Badge>
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
                          disabled={loadingActionId === customer.id}
                        >
                          {loadingActionId === customer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleChangeType(customer)}>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          {/* Ubah ke {customer.type === 'wholesale' ? 'Base' : 'Wholesale'} */}
                          Ubah ke {customer.type === 'wholesale' ? 'Retail' : 'Toko'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(customer)}
                          className={customer.isActive ? 'text-destructive focus:text-destructive' : ''}
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
