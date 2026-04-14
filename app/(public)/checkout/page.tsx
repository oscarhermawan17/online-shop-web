'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckoutForm, CartSummary } from '@/components/public';
import { EmptyState } from '@/components/shared';
import { useCartStore, useCustomerAuthStore } from '@/stores';
import { toast } from 'sonner';
import api from '@/lib/api';
import { fetchShippingZones, type ShippingArea } from '@/lib/shipping';
import type { CheckoutFormData } from '@/lib/validations';
import type { CheckoutResponse, DeliveryMethod } from '@/types';
import type { Store } from '@/types';
import { formatRupiah } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [store, setStore] = useState<Pick<
    Store,
    | 'name'
    | 'address'
    | 'deliveryRetailMinimumOrder'
    | 'deliveryStoreMinimumOrder'
    | 'deliveryRetailFreeShippingMinimumOrder'
    | 'deliveryStoreFreeShippingMinimumOrder'
  > | null>(null);

  // Track form state for the summary sidebar
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(null);
  const [shippingZones, setShippingZones] = useState<ShippingArea[]>([]);

  const items = useCartStore((state) => state.items);
  const storeId = useCartStore((state) => state.storeId);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getTotalPrice());
  const customer = useCustomerAuthStore((state) => state.customer);
  const customerToken = useCustomerAuthStore((state) => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch store info and shipping zones
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<{ data: Store }>('/store');
        const data = res.data.data;
        setStore({
          name: data.name,
          address: data.address,
          deliveryRetailMinimumOrder: data.deliveryRetailMinimumOrder,
          deliveryStoreMinimumOrder: data.deliveryStoreMinimumOrder,
          deliveryRetailFreeShippingMinimumOrder: data.deliveryRetailFreeShippingMinimumOrder,
          deliveryStoreFreeShippingMinimumOrder: data.deliveryStoreFreeShippingMinimumOrder,
        });
      } catch {
        // Store info is optional for checkout
      }
      const zones = await fetchShippingZones();
      setShippingZones(zones);
    }
    fetchData();
  }, []);

  // Compute shipping from detected district (point-in-polygon)
  const shipping = useMemo(() => {
    if (deliveryMethod !== 'delivery' || !detectedDistrict) return null;
    const zone = shippingZones.find((z) => z.district === detectedDistrict);
    if (zone) return { district: zone.district, cost: zone.cost };
    return null;
  }, [deliveryMethod, detectedDistrict, shippingZones]);

  const isStoreCustomer = !!customerToken && !!customer;

  const minimumOrder = isStoreCustomer
    ? (store?.deliveryStoreMinimumOrder ?? null)
    : (store?.deliveryRetailMinimumOrder ?? null);

  const freeShippingMinimumOrder = isStoreCustomer
    ? (store?.deliveryStoreFreeShippingMinimumOrder ?? null)
    : (store?.deliveryRetailFreeShippingMinimumOrder ?? null);

  const isFreeShippingApplied = deliveryMethod === 'delivery'
    && freeShippingMinimumOrder !== null
    && subtotal >= freeShippingMinimumOrder;

  const effectiveShippingCost = deliveryMethod === 'delivery'
    ? (isFreeShippingApplied ? 0 : (shipping?.cost ?? null))
    : null;

  // Shipping unavailable: delivery mode, pin placed on map, but no zone matched
  const pinPlaced = detectedDistrict !== null;
  const shippingUnavailable = deliveryMethod === 'delivery' && pinPlaced && !shipping;

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          type="cart"
          title="Keranjang Kosong"
          description="Tambahkan produk ke keranjang sebelum checkout."
          actionLabel="Lihat Produk"
          actionHref="/"
        />
      </div>
    );
  }

  const handleCheckout = async (data: CheckoutFormData) => {
    if (!storeId) {
      toast.error('Store ID tidak ditemukan');
      return;
    }

    if (data.deliveryMethod === 'delivery' && !shipping) {
      toast.error('Maaf, kami belum melayani pengiriman ke daerah Anda');
      return;
    }

    if (
      data.deliveryMethod === 'delivery'
      && minimumOrder !== null
      && subtotal < minimumOrder
    ) {
      toast.error(
        `Minimal belanja untuk pengiriman ${isStoreCustomer ? 'toko' : 'retail'} adalah ${formatRupiah(minimumOrder)}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const isPickup = data.deliveryMethod === 'pickup';
      const payload = {
        storeId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: isPickup ? (store?.address || 'Pickup di toko') : (data.customerAddress || ''),
        deliveryMethod: data.deliveryMethod as DeliveryMethod,
        paymentMethod: data.paymentMethod,
        notes: data.notes || undefined,
        shippingCost: isPickup ? 0 : (effectiveShippingCost ?? 0),
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
      };

      const response = await api.post<{ data: CheckoutResponse }>('/checkout', payload);
      const result = response.data.data;

      toast.success('Pesanan berhasil dibuat!');
      clearCart();

      // Redirect to order page
      router.push(`/order/${result.publicOrderId}`);
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cart">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <CheckoutForm
            onSubmit={handleCheckout}
            isSubmitting={isSubmitting}
            storeAddress={store?.address}
            storeName={store?.name}
            onDeliveryMethodChange={setDeliveryMethod}
            onDistrictDetected={setDetectedDistrict}
            shippingUnavailable={shippingUnavailable}
          />
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24">
          <CartSummary
            showCheckoutButton={false}
            deliveryMethod={deliveryMethod}
            shippingCost={effectiveShippingCost}
            shippingDistrict={shipping?.district ?? null}
            shippingUnavailable={shippingUnavailable}
            minimumOrder={minimumOrder}
            freeShippingMinimumOrder={freeShippingMinimumOrder}
            subtotal={subtotal}
            isStoreCustomer={isStoreCustomer}
            isFreeShippingApplied={isFreeShippingApplied}
          />
        </div>
      </div>
    </div>
  );
}
