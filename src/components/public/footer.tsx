import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-primary">TokoKu</h3>
            <p className="text-sm text-muted-foreground">
              Toko online terpercaya untuk kebutuhan Anda.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-semibold">Menu</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Beranda
              </Link>
              <Link
                href="/#products"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Produk
              </Link>
              <Link
                href="/cart"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Keranjang
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-semibold">Cek Pesanan</h4>
            <p className="text-sm text-muted-foreground">
              Punya nomor pesanan? Cek status pesanan Anda.
            </p>
            <Link
              href="/order"
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              Lacak Pesanan →
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>© {currentYear} TokoKu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
