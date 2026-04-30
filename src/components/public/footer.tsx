import Link from "next/link"

interface FooterProps {
  storeName: string
  storeDescription?: string
  storeAddress?: string
}

export function Footer({
  storeName,
  storeDescription,
  storeAddress,
}: FooterProps) {
  const year = new Date().getFullYear()
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
            <div className="flex gap-4 items-center">
              {["f", "✉", "☎"].map((icon, i) => (
                <div
                  key={i}
                  className="bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-10 flex items-center justify-center cursor-pointer hover:bg-[#f1f4f2] transition-colors"
                >
                  <span className="text-[#59615f] text-xs">{icon}</span>
                </div>
              ))}
            </div>
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
                  0800-1-GROSIR (476747)
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <p className="text-[#757c7a] text-xs font-bold uppercase tracking-wide leading-4">
                  Metode Pembayaran
                </p>
                <div className="flex gap-2 opacity-60">
                  {["BCA", "MANDIRI", "BNI"].map((bank) => (
                    <div
                      key={bank}
                      className="bg-white rounded shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-6 px-2 flex items-center justify-center"
                    >
                      <span className="text-[#2d3432] text-[10px] font-bold">
                        {bank}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
