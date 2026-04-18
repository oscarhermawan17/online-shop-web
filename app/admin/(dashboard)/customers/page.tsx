"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomerTable } from "@/components/admin"
import { LoadingPage, ErrorMessage, EmptyState } from "@/components/shared"
import { useAdminCustomers } from "@/hooks"

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")

  // Debounce search: reset to page 1 when search changes
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset to page 1 when status or limit changes
  const handleStatusChangeFilter = (value: "all" | "active" | "inactive") => {
    setStatus(value)
    setPage(1)
  }

  const handleLimitChange = (value: number) => {
    setLimit(value)
    setPage(1)
  }

  const { customers, pagination, isLoading, isValidating, isError, mutate } =
    useAdminCustomers({
      page,
      limit,
      search,
      status,
    })

  // Show full loading page only on the very first fetch (no data at all yet)
  if (isLoading) {
    return <LoadingPage />
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Pelanggan"
        message="Tidak dapat memuat daftar pelanggan"
        onRetry={() => mutate()}
      />
    )
  }

  const total = pagination?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daftar Pelanggan</h1>
          <p className="text-muted-foreground">{total} pelanggan</p>
        </div>
        <Button asChild>
          <Link href="/admin/customers/add">
            <Plus className="mr-2 h-4 w-4" />
            Tambah User Wholesale
          </Link>
        </Button>
      </div>

      {!isLoading && total === 0 && !search && !status ? (
        <EmptyState
          type="default"
          title="Belum Ada Pelanggan"
          description="Mulai dengan menambahkan user wholesale pertama Anda atau tunggu user base mendaftar sendiri."
          actionLabel="Tambah User Wholesale"
          actionHref="/admin/customers/add"
        />
      ) : (
        <CustomerTable
          customers={customers}
          pagination={pagination}
          isLoading={isValidating}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          status={status}
          onStatusChange={() => mutate()}
          onStatusChangeFilter={handleStatusChangeFilter}
          limit={limit}
          onLimitChange={handleLimitChange}
          page={page}
          onPageChange={setPage}
          onToggleStatus={() => mutate()}
        />
      )}
    </div>
  )
}
