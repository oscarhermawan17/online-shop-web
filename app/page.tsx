import { Suspense } from 'react';
import { ProductCard, ProductCardSkeleton, Header, Footer } from '@/components/public';
import { getStoreInfo } from '@/lib/get-store-info';
import type { ProductListItem } from '@/types';

export const revalidate = 0;

async function getProducts(): Promise<ProductListItem[]> {
  try {
    const baseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function ProductGrid() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#757c7a]">Belum ada produk tersedia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const { name: storeName } = await getStoreInfo();

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf8]">
      <Header storeName={storeName} />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-16 flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-8 w-64 shrink-0">
            <div className="flex flex-col gap-4">
              <h2 className="text-[#2d3432] text-lg font-bold leading-7">Refine Search</h2>

              {/* Kategori */}
              <div className="flex flex-col gap-3">
                <p className="text-[#acb4b1] text-[12px] font-semibold uppercase tracking-[0.6px]">
                  Kategori
                </p>
                <div className="flex flex-col gap-2">
                  {['Sembako', 'Peralatan Rumah', 'Kebersihan'].map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <div className="w-4 h-4 border border-[#acb4b1] rounded bg-white shrink-0" />
                      <span className="text-[#59615f] text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rentang Harga */}
              <div className="flex flex-col gap-3 pt-2">
                <p className="text-[#acb4b1] text-[12px] font-semibold uppercase tracking-[0.6px]">
                  Rentang Harga (IDR)
                </p>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Min"
                      className="bg-[#f1f4f2] border border-[#acb4b1] border-b-2 pl-9 pr-3 py-2.5 text-sm text-[#2d3432] placeholder-[#6b7280] w-full outline-none focus:border-b-[#006f1d]"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757c7a] text-xs pointer-events-none">Rp</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Max"
                      className="bg-[#f1f4f2] border border-[#acb4b1] border-b-2 pl-9 pr-3 py-2.5 text-sm text-[#2d3432] placeholder-[#6b7280] w-full outline-none focus:border-b-[#006f1d]"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757c7a] text-xs pointer-events-none">Rp</span>
                  </div>
                </div>
              </div>

              {/* Stok */}
              <div className="flex flex-col gap-3 pt-2">
                <p className="text-[#acb4b1] text-[12px] font-semibold uppercase tracking-[0.6px]">
                  Stok
                </p>
                <div className="flex flex-col gap-2">
                  {['Tersedia', 'Pre-order'].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer">
                      <div className="w-4 h-4 border border-[#acb4b1] rounded-full bg-white shrink-0" />
                      <span className="text-[#59615f] text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Mitra CTA */}
            <div className="bg-[rgba(145,247,142,0.3)] border border-[#91f78e] rounded-xl p-4 flex flex-col gap-2">
              <p className="text-[#005e17] text-xs font-medium">Ingin jadi Mitra?</p>
              <p className="text-[rgba(0,94,23,0.8)] text-[11px] leading-[17.88px]">
                Dapatkan harga khusus grosir untuk toko Anda dengan mendaftar sebagai mitra resmi.
              </p>
              <button className="bg-[#006f1d] text-[#eaffe2] text-xs font-bold py-2 rounded-lg hover:bg-[#005e17] transition-colors w-full">
                Daftar Sekarang
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">

            {/* Promo Banner (Bento) */}
            <div className="grid grid-cols-3 gap-4 h-48">
              {/* Main promo */}
              <div className="col-span-2 bg-[#006f1d] rounded-2xl overflow-hidden relative flex items-center">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-green-300 via-transparent to-transparent" />
                <div className="relative z-10 p-8">
                  <div className="bg-[#f9fbb7] text-[#5e602c] text-[10px] font-bold tracking-[1px] uppercase px-2 py-1 rounded inline-block mb-3">
                    PROMO UNGGULAN
                  </div>
                  <h2 className="text-white font-extrabold text-[30px] leading-[37.5px] mb-3">
                    Grosir Minyak Goreng<br />Diskon s/d 15%
                  </h2>
                  <p className="text-[#eaffe2] text-sm leading-5">
                    Stok terbatas untuk kebutuhan restoran dan katering.
                  </p>
                </div>
              </div>

              {/* Secondary promo */}
              <div className="bg-[#d5e8cf] rounded-2xl overflow-hidden relative p-6 flex flex-col justify-between">
                <div className="absolute bottom-[-16px] right-[-16px] bg-[rgba(0,111,29,0.1)] rounded-full size-32 blur-xl" />
                <div className="relative z-10">
                  <h3 className="text-[#465643] font-bold text-lg leading-[24.75px] mb-1">
                    Peralatan<br />Rumah Tangga
                  </h3>
                  <p className="text-[rgba(70,86,67,0.7)] text-xs">Lengkap &amp; Ekonomis</p>
                </div>
                <button className="relative z-10 flex items-center gap-1 text-[#006f1d] text-xs font-bold hover:underline self-start">
                  Lihat Semua →
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <section id="products">
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid />
              </Suspense>
            </section>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <button className="p-2 rounded-lg text-[#59615f] hover:bg-[#f1f4f2] transition-colors text-lg leading-none">‹</button>
              <button className="bg-[#006f1d] text-[#eaffe2] font-bold text-base w-10 h-10 rounded-lg flex items-center justify-center">1</button>
              {[2, 3].map((n) => (
                <button key={n} className="text-[#59615f] font-medium text-base w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#f1f4f2] transition-colors">
                  {n}
                </button>
              ))}
              <span className="text-[#757c7a] w-10 h-10 flex items-center justify-center text-base">...</span>
              <button className="text-[#59615f] font-medium text-base w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#f1f4f2] transition-colors">10</button>
              <button className="p-2 rounded-lg text-[#59615f] hover:bg-[#f1f4f2] transition-colors text-lg leading-none">›</button>
            </div>
          </div>
        </div>
      </main>

      <Footer storeName={storeName} />
    </div>
  );
}
