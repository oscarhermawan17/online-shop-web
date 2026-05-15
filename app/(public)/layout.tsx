import { Header, Footer, BottomNav } from "@/components/public"

export const dynamic = "force-dynamic"
import { getStoreInfo } from "@/lib/get-store-info"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    name: storeName,
    description: storeDescription,
    address: storeAddress,
    bankAccounts,
    qrisImageUrl,
    whatsappNumber,
    instagramUrl,
    tiktokUrl,
    youtubeUrl,
  } = await getStoreInfo()

  return (
    <div className="flex min-h-screen flex-col">
      <Header storeName={storeName} />
      <main className="relative z-0 flex-1 pb-16 md:pb-0">{children}</main>
      <div className="hidden md:block">
        <Footer
          storeName={storeName}
          storeDescription={storeDescription}
          storeAddress={storeAddress}
          bankAccounts={bankAccounts}
          qrisImageUrl={qrisImageUrl}
          storePhone={whatsappNumber}
          instagramUrl={instagramUrl}
          tiktokUrl={tiktokUrl}
          youtubeUrl={youtubeUrl}
        />
      </div>
      <BottomNav />
    </div>
  )
}
