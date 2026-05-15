import Link from "next/link"
import { BANK_NAME_LABELS, type StoreBankAccount } from "@/types/store"

interface FooterProps {
  storeName: string
  storeDescription?: string
  storeAddress?: string
  bankAccounts?: StoreBankAccount[]
  qrisImageUrl?: string
  storePhone?: string
  instagramUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function Footer({
  storeName,
  storeDescription,
  storeAddress,
  bankAccounts = [],
  qrisImageUrl,
  storePhone,
  instagramUrl,
  tiktokUrl,
  youtubeUrl,
}: FooterProps) {
  const year = new Date().getFullYear()

  const socialLinks = [
    { url: instagramUrl, Icon: InstagramIcon, label: "Instagram" },
    { url: tiktokUrl, Icon: TiktokIcon, label: "TikTok" },
    { url: youtubeUrl, Icon: YoutubeIcon, label: "YouTube" },
  ].filter((s) => Boolean(s.url))

  return (
    <footer className="bg-[#eaefec] border-t border-transparent">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-16 flex flex-col gap-16">
        {/* Main footer columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#166534] font-bold text-2xl leading-8">
              {storeName}
            </h3>
            <p className="text-[#59615f] text-sm leading-[22.75px]">
              {storeDescription ||
                "Mitra terpercaya untuk pemenuhan kebutuhan stok warung, toko kelontong, dan bisnis UMKM Anda di seluruh Indonesia."}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3 items-center">
                {socialLinks.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-10 flex items-center justify-center text-[#59615f] hover:text-[#166534] hover:bg-[#f1f4f2] transition-colors"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-6 md:col-start-4">
            <h4 className="text-[#2d3432] font-bold text-base leading-6">
              Hubungi Kami
            </h4>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <span className="text-[#59615f] mt-0.5 shrink-0">📍</span>
                <p className="text-[#59615f] text-sm leading-5">
                  {storeAddress || "Alamat Lengkap"}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-[#59615f] shrink-0">📞</span>
                <p className="text-[#59615f] text-sm leading-5">
                  {storePhone || "—"}
                </p>
              </div>
              {(bankAccounts.length > 0 || qrisImageUrl) && (
                <div className="flex flex-col gap-2 pt-4">
                  <p className="text-[#757c7a] text-xs font-bold uppercase tracking-wide leading-4">
                    Metode Pembayaran
                  </p>
                  <div className="flex flex-wrap gap-2 opacity-60">
                    {bankAccounts.map((account) => (
                      <div
                        key={account.id ?? account.bankName}
                        className="bg-white rounded shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-6 px-2 flex items-center justify-center"
                      >
                        <span className="text-[#2d3432] text-[10px] font-bold uppercase">
                          {BANK_NAME_LABELS[account.bankName]}
                        </span>
                      </div>
                    ))}
                    {qrisImageUrl && (
                      <div className="bg-white rounded shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-6 px-2 flex items-center justify-center">
                        <span className="text-[#2d3432] text-[10px] font-bold">
                          QRIS
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[rgba(172,180,177,0.2)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#757c7a] text-xs">
            © {year} {storeName}. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-[#757c7a] text-xs hover:text-[#006f1d] transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="#"
              className="text-[#757c7a] text-xs hover:text-[#006f1d] transition-colors"
            >
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
