# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deployment

- **Prod**: `ghcr.io/oscarhermawan17/online-shop-web:latest` — `tokotimika.my.id`
- **Stg**: `ghcr.io/oscarhermawan17/online-shop-web:staging` — `stg.tokotimika.my.id`
- CI/CD: push to `main` → `:latest`, push to `stg` → `:staging`, auto-deploys to VPS
- `NEXT_PUBLIC_API_URL=/api` (relative) — works for both prod and stg domains via nginx
- `API_URL=http://api:4000/api` hardcoded in Dockerfile (server-side SSR, prod only)
- Cloudinary: browser uploads directly — `NEXT_PUBLIC_CLOUDINARY_*` baked in at build time
- **Planned**: replace Cloudinary with MinIO for stg when local stack is ready

---

## Commands

```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test suite is configured. There are no unit or integration tests in this project.

## Architecture Overview

Next.js 16 App Router project (React 19, TypeScript, Tailwind CSS v4). The app is a B2B/B2C online shop for UMKM (Indonesian SMBs). All pages use `export const dynamic = 'force-dynamic'` — there is no static generation.

### Three distinct app sections

| Route group | Path | Auth |
|---|---|---|
| Public storefront | `app/(public)/` | None (customer token optional) |
| Customer dashboard | `app/dashboard/` | Customer JWT (`customer-auth-storage`) |
| Admin panel | `app/admin/` | Admin JWT (`auth-storage`) |

The root `app/layout.tsx` is a thin shell (font, `<Toaster>`, metadata from `getStoreInfo()`). Auth guards are implemented in each section's `layout.tsx` via a Zustand hydration check, **not** middleware.

### API Client (`src/lib/api.ts`)

Single Axios instance pointing to `NEXT_PUBLIC_API_URL` (client) or `API_URL` (server). Two separate auth tokens are read from `localStorage` by an Axios request interceptor:
- Routes starting with `/admin` or `/auth` → reads `auth-storage` (admin token)
- All other routes → reads `customer-auth-storage` (customer token)

On 401, the response interceptor hard-redirects: `/admin` routes go to `/admin/login`, `/dashboard` routes go to `/login`.

**SWR fetchers** (also in `api.ts`):
- `fetcher<T>` — unwraps `response.data.data` (standard API shape)
- `responseFetcher<T>` — returns `response.data` as-is (for paginated responses)

### Data Fetching Strategy

- **Server components** (`page.tsx` files): use `fetch()` directly with `cache: 'no-store'`, reading from `process.env.API_URL` (preferred) or `NEXT_PUBLIC_API_URL`
- **Client components**: use SWR hooks from `src/hooks/` which call the Axios client
- **`src/lib/products.ts`**: `fetchPublicProducts()` is used server-side for the homepage SSR; `buildPublicProductsUrl()` is also used by the `useProducts` SWR hook client-side

### State Management (Zustand, `src/stores/`)

All three stores use `persist` middleware to `localStorage`:

| Store | Key | Purpose |
|---|---|---|
| `useAuthStore` | `auth-storage` | Admin JWT + role (`owner`/`manager`/`staff`) |
| `useCustomerAuthStore` | `customer-auth-storage` | Customer JWT |
| `useCartStore` | `cart-storage` | Cart items + `storeId` |

**Hydration pattern**: Client layouts read from Zustand on mount via a `isHydrated` flag set in `useEffect`. Never access Zustand state on the server.

### Forms

All forms use `react-hook-form` + `@hookform/resolvers` + `zod`. Schemas live in `src/lib/validations/`. Form fields always use the `<Form>` / `<FormField>` / `<FormItem>` wrappers from `src/components/ui/form.tsx` (shadcn).

### Image Uploads

Images are uploaded directly to Cloudinary from the browser via `src/lib/cloudinary.ts` (`uploadToCloudinary()`). The `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` env vars are required. The `next-cloudinary` package is installed but image transforms are done manually via URL string manipulation in `getOptimizedImageUrl()` / `getThumbnailUrl()`.

The `app/api/image-proxy/route.ts` Route Handler proxies external images (for cases where direct browser loading fails).

### Shipping & Map

`src/lib/shipping.ts` fetches shipping zones from `/shipping-zones` and caches them in module-level memory. Shipping cost is determined by substring-matching the customer's typed address against district names. `react-leaflet` is used in `src/components/admin/shipping-zone-map.tsx` and `src/components/public/address-map.tsx` for zone visualization; `leaflet/dist/leaflet.css` is imported globally in `app/layout.tsx`.

### UI Components

`src/components/ui/` — shadcn/ui components (Radix UI primitives + Tailwind). Do not edit these manually; use `npx shadcn add <component>` to add new ones.

Custom components are split into three namespaces:
- `src/components/public/` — storefront-facing components
- `src/components/admin/` — admin panel components
- `src/components/shared/` — `EmptyState`, `ErrorMessage`, `Loading`, `OrderCard` (used across sections)

Each namespace has an `index.ts` barrel export.

## Key Types (`src/types/`)

- `Product`, `ProductListItem`, `ProductVariant`, `ProductDiscount` — product catalogue
- `Order`, `PublicOrder` — order with full details; `OrderStatus` union: `pending_payment | waiting_confirmation | paid | shipped | done | expired_unpaid | cancelled`
- `PaymentMethod`: `bank_transfer | credit`
- `DeliveryMethod`: `pickup | delivery`
- `Store` — store settings including bank info, QRIS, and minimum order thresholds (separate retail vs store-customer thresholds)
- `CustomerAddress` — saved address with optional GPS coordinates
- `CarouselSlide` — homepage carousel managed from admin

## Environment Variables

```
NEXT_PUBLIC_API_URL=      # Backend API base URL (browser + server fallback)
API_URL=                  # Backend API base URL (server-side only, preferred)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

In production (`.env.prod`), the frontend calls `API_URL=http://api:4000/api` (Docker internal) and `NEXT_PUBLIC_API_URL=/api` (browser via reverse proxy). The app is designed to run inside Docker alongside a backend container named `api`.

## Routing Reference

```
/                           Homepage — SSR product grid + carousel + promos
/catalog                    Full catalogue with sidebar filters
/product/[id]               Product detail with variant selector
/cart                       Cart page (client-only, Zustand)
/checkout                   Checkout form with map-based shipping detection
/order/[publicOrderId]      Public order status page (polls every 30s via SWR)
/order                      Customer order list (requires customer auth)
/promo                      Promo products listing
/login                      Customer login/register
/dashboard                  Customer account overview
/dashboard/orders           Customer order history
/dashboard/address          Saved address management

/admin/login                Admin login
/admin                      Admin dashboard (stats + recent orders)
/admin/products             Product list + management
/admin/products/new         Create product
/admin/products/[id]        Edit product (variants, images, discounts)
/admin/orders               Order list with status filter
/admin/orders/[id]          Order detail + ship/cancel actions
/admin/customers            Customer list
/admin/customers/add        Add customer manually
/admin/category             Category management
/admin/satuan               Unit (satuan) management
/admin/shipping-zones       Zone map + cost management
/admin/shipping-drivers     Delivery driver management
/admin/shipping-shifts      Delivery shift management
/admin/store                Store settings (bank, QRIS, minimum orders)
/admin/credit               Customer credit limits
/admin/receivables          Credit receivables (piutang) tracking
```
