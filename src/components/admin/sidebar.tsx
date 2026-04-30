"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Users,
  WalletCards,
  HandCoins,
  Boxes,
  MapPinned,
  Clock3,
  UserRound,
  LogOut,
  Tags,
  Scale,
  Menu,
  ChevronLeft,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores"

const navGroups = [
  {
    label: null,
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Katalog",
    items: [
      { href: "/admin/products", label: "Produk", icon: Package, exact: false },
      { href: "/admin/category", label: "Kategori", icon: Tags, exact: false },
      { href: "/admin/satuan", label: "Satuan", icon: Scale, exact: false },
      {
        href: "/admin/inventory",
        label: "Stok / Inventory",
        icon: Boxes,
        exact: false,
      },
    ],
  },
  {
    label: "Transaksi",
    items: [
      {
        href: "/admin/orders",
        label: "Pesanan",
        icon: ShoppingCart,
        exact: false,
      },
      {
        href: "/admin/customers",
        label: "Pelanggan",
        icon: Users,
        exact: false,
      },
      {
        href: "/admin/credit",
        label: "Limit Credit",
        icon: WalletCards,
        exact: false,
      },
      {
        href: "/admin/receivables",
        label: "Piutang",
        icon: HandCoins,
        exact: false,
      },
    ],
  },
  {
    label: "Pengiriman",
    items: [
      {
        href: "/admin/shipping-zones",
        label: "Area Pengiriman",
        icon: MapPinned,
        exact: false,
      },
      {
        href: "/admin/shipping-shifts",
        label: "Shift Pengiriman",
        icon: Clock3,
        exact: false,
      },
      {
        href: "/admin/shipping-drivers",
        label: "Driver Pengiriman",
        icon: UserRound,
        exact: false,
      },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      {
        href: "/admin/store",
        label: "Pengaturan Toko",
        icon: Store,
        exact: false,
      },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 min-h-screen bg-[#f8fafc] transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Branding + Toggle */}
      <div className="px-3 pt-4 pb-6 flex items-center justify-between">
        {!collapsed && (
          <div className="px-1 py-2">
            <p className="text-[#14532d] font-bold text-xl tracking-[-0.5px] leading-7">
              Admin Grosir
            </p>
            <p className="text-[#64748b] font-medium text-xs leading-4">
              Manajemen Toko
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex items-center justify-center rounded-lg w-8 h-8 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#2d3432] transition-colors shrink-0",
            collapsed && "mx-auto",
          )}
        >
          {collapsed ? (
            <Menu className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4 px-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-1">
            {group.label && !collapsed && (
              <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="my-1 border-t border-[#e2e8f0]" />
            )}
            {group.items.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-[#dcfce7] text-[#166534] font-bold"
                      : "text-[#475569] font-normal hover:bg-[#f1f5f9] hover:text-[#2d3432]",
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && label}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Keluar" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#a73b21] w-full hover:bg-[rgba(253,121,90,0.08)] transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Keluar"}
        </button>
      </nav>
    </aside>
  )
}
