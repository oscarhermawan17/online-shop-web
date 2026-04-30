"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Tag, Bell, User, LayoutGrid } from "lucide-react"
import { useCustomerAuthStore } from "@/stores"
import { useState, useEffect } from "react"

const baseNavItems = [
  { href: "/", label: "Beranda", icon: Home, exact: true },
  { href: "/catalog", label: "Katalog", icon: LayoutGrid, exact: false },
  { href: "/promo", label: "Deals", icon: Tag, exact: false },
  { href: "/notifications", label: "Notifikasi", icon: Bell, exact: false },
  { href: "/dashboard", label: "Akun", icon: User, exact: false },
]

export function BottomNav() {
  const pathname = usePathname()
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render all 5 items until mounted to match SSR, then filter based on auth
  const navItems =
    mounted && !isAuthenticated()
      ? baseNavItems.filter((item) => item.label !== "Notifikasi")
      : baseNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-60 h-16 bg-white border-t border-black/10 shadow-[0px_-2px_10px_rgba(0,0,0,0.05)] md:hidden overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex h-full w-full items-center px-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          let isActive = exact ? pathname === href : pathname.startsWith(href)

          // Alias /dashboard to Akun
          if (
            label === "Akun" &&
            (pathname === "/dashboard" || pathname.startsWith("/dashboard"))
          ) {
            isActive = true
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 snap-start flex-col items-center justify-center gap-1 py-1 transition-all duration-200 ${
                isActive ? "scale-110" : "scale-100"
              }`}
            >
              <div
                className={`relative ${isActive ? "text-[#166534]" : "text-[#64748b]"}`}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                {label === "Notifikasi" && (
                  <span className="absolute -top-1 -right-1 bg-[#dc2626] text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center border-2 border-white">
                    38
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] leading-none ${
                  isActive
                    ? "text-[#166534] font-bold"
                    : "text-[#64748b] font-medium"
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
