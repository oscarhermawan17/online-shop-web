import { Suspense } from 'react';
import { ProductCard, ProductCardSkeleton, CategoryHorizontalList, PromoHorizontalList } from '@/components/public';
import type { ProductListItem } from '@/types';

export const dynamic = 'force-dynamic';

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

function ProductGrid({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#757c7a]">Belum ada produk tersedia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const products = await getProducts();
  const promoProducts = products.filter(p => p.stock < 20 || p.basePrice < 100000).slice(0, 6);

  return (
    <div className="bg-[#f8faf8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-16 flex flex-col lg:flex-row gap-8">

        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex flex-col gap-8 w-64 shrink-0">
          <div className="flex flex-col gap-4">
            <h2 className="text-[#2d3432] text-lg font-bold">Refine Search</h2>

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
                    className="bg-[#f1f4f2] border border-[#acb4b1] border-b-2 pl-9 pr-3 py-2.5 text-sm w-full outline-none focus:border-b-[#166534]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757c7a] text-xs pointer-events-none">Rp</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Max"
                    className="bg-[#f1f4f2] border border-[#acb4b1] border-b-2 pl-9 pr-3 py-2.5 text-sm w-full outline-none focus:border-b-[#166534]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757c7a] text-xs pointer-events-none">Rp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mitra CTA */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex flex-col gap-2">
            <p className="text-[#166534] text-xs font-semibold">Ingin jadi Mitra?</p>
            <p className="text-[#166534]/80 text-[11px] leading-[17px]">
              Dapatkan harga khusus grosir untuk toko Anda dengan mendaftar sebagai mitra resmi.
            </p>
            <button className="bg-[#166534] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#14532d] transition-colors w-full">
              Daftar Sekarang
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 md:gap-8">

          {/* Promo Banner (Bento) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-48">
            {/* Main promo */}
            <div className="md:col-span-2 bg-[#166534] rounded-2xl overflow-hidden relative flex items-center min-h-[160px]">
              <div className="absolute inset-0 opacity-20 bg-linear-to-br from-white via-transparent to-transparent" />
              <div className="relative z-10 p-6 md:p-8">
                <div className="bg-[#f9fbb7] text-[#5e602c] text-[10px] font-bold tracking-[1px] uppercase px-2 py-1 rounded inline-block mb-3">
                  PROMO UNGGULAN
                </div>
                <h2 className="text-white font-extrabold text-2xl md:text-[30px] md:leading-[37.5px] mb-2 md:mb-3">
                  Grosir Minyak Goreng<br />Diskon s/d 15%
                </h2>
                <p className="text-[#eaffe2] text-xs md:text-sm">
                  Stok terbatas untuk kebutuhan restoran dan katering.
                </p>
              </div>
            </div>

            {/* Secondary promo - Hidden on mobile, visible on md+ */}
            <div className="hidden md:flex bg-[#dcfce7] rounded-2xl overflow-hidden relative p-6 flex flex-col justify-between">
              <div className="absolute -bottom-4 -right-4 bg-[#166534]/10 rounded-full size-32 blur-xl" />
              <div className="relative z-10">
                <h3 className="text-[#166534] font-bold text-lg leading-tight mb-1">
                  Peralatan<br />Rumah Tangga
                </h3>
                <p className="text-[#166534]/70 text-xs">Lengkap & Ekonomis</p>
              </div>
              <button className="relative z-10 flex items-center gap-1 text-[#166534] text-xs font-bold hover:underline self-start">
                Lihat Semua →
              </button>
            </div>
          </div>

          {/* Category Horizontal List */}
          <section>
            <CategoryHorizontalList />
          </section>

          {/* Promo Products Section */}
          <section>
            <PromoHorizontalList products={promoProducts} title="🔥 Promo Puncak" />
          </section>

          {/* All Products Grid */}
          <section id="products" className="flex flex-col gap-4">
            <h3 className="px-2 text-[#2d3432] font-bold text-lg uppercase tracking-tight">Katalog Produk</h3>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={products} />
            </Suspense>
          </section>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <button className="p-2 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors leading-none">‹</button>
            <button className="bg-[#166534] text-white font-bold w-10 h-10 rounded-lg flex items-center justify-center">1</button>
            {[2, 3].map((n) => (
              <button key={n} className="text-[#64748b] font-medium w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">
                {n}
              </button>
            ))}
            <span className="text-[#94a3b8] w-10 h-10 flex items-center justify-center">...</span>
            <button className="text-[#64748b] font-medium w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">10</button>
            <button className="p-2 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors leading-none">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
