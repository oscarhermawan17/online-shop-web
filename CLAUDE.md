# CLAUDE.md — online-shop-web

## Deployment

- **Prod**: `ghcr.io/oscarhermawan17/online-shop-web:latest` — `tokotimika.my.id`
- **Stg**: `ghcr.io/oscarhermawan17/online-shop-web:staging` — `stg.tokotimika.my.id`
- CI/CD: push to `main` → `:latest`, push to `stg` → `:staging`, auto-deploys to VPS
- `NEXT_PUBLIC_API_URL=/api` (relative) — works for both prod and stg domains via nginx
- `API_URL=http://api:4000/api` set in docker-compose environment (server-side SSR, prod only)
- Storage (stg): MinIO ✅ — all uploads go through presigned URLs (`/api/upload/presign` + `/api/upload/confirm`)
- Storage (prod): Cloudinary still used (migration to MinIO planned after stg is stable)
- GitHub build args: `NEXT_PUBLIC_API_URL`, `NODE_ENV`, `NEXT_PUBLIC_STORE_ID` — MinIO vars are runtime, not build-time

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

All uploads go through MinIO via presigned URLs. `src/lib/cloudinary.ts` still exists but is no longer imported anywhere — kept for reference only.

Upload flow:
1. `src/lib/storage.ts` → `uploadFile(file, purpose)` — compresses image in browser (`browser-image-compression`), then calls `/api/upload/presign`
2. `/api/upload/presign` (Next.js route) → generates presigned PUT URL for `temp/{tenantId}/{purpose}/{uuid}.ext`
3. Browser PUTs file directly to MinIO (no file passes through Next.js)
4. On form submit → `confirmUpload(tempKey)` calls `/api/upload/confirm`
5. `/api/upload/confirm` copies `temp/...` → `{tenantId}/{purpose}/{uuid}.ext`, deletes temp, returns permanent URL

Upload purposes and compression settings (in `src/lib/storage.ts`):
| Purpose | Max Size | Max Dimension |
|---|---|---|
| `products` | 0.5MB (env) | 1200px (env) |
| `carousel` | 0.8MB | 1920px |
| `payment` | 0.3MB | 1000px |
| `customer` | 0.3MB | 800px |
| `category` | 0.1MB | 400px |
| `qris` | 0.2MB | 800px |
| `complaint` | 0.5MB | 1200px |

Components that use uploads: `image-upload.tsx` (products), `carousel-manager.tsx`, `upload-payment-proof.tsx`, `store/page.tsx` (QRIS), `category/page.tsx` (icon), `dashboard/page.tsx` (avatar), order complaint flow (evidence images).

`getOptimizedImageUrl()` and `getThumbnailUrl()` in `src/lib/utils.ts` return URLs as-is (no transformation). `next.config.ts` has `unoptimized: true` — bypasses `/_next/image` pipeline entirely (MinIO serves plain URLs, Cloudinary does its own optimization).

### Shipping & Map

`src/lib/shipping.ts` fetches shipping zones from `/shipping-zones` and caches them in module-level memory. Shipping cost is determined by substring-matching the customer's typed address against district names. `react-leaflet` is used in `src/components/admin/shipping-zone-map.tsx` and `src/components/public/address-map.tsx` for zone visualization; `leaflet/dist/leaflet.css` is imported globally in `app/layout.tsx`.

### UI Components

`src/components/ui/` — shadcn/ui components (Radix UI primitives + Tailwind). Do not edit these manually; use `npx shadcn add <component>` to add new ones.

Custom components are split into three namespaces:
- `src/components/public/` — storefront-facing components
- `src/components/admin/` — admin panel components
- `src/components/shared/` — `EmptyState`, `ErrorMessage`, `Loading`, `OrderCard`, `OrderItemImage` (used across sections)

Each namespace has an `index.ts` barrel export.

### Discount Display

`src/lib/variant-discount.ts` — client-side utility that mirrors backend discount rule evaluation. Used in `ProductCard` to show discount hints and crossed-out prices. Handles both the rule-based system (VariantDiscountRule / ProductDiscountRule) and legacy ProductDiscount.

### Report Downloads

`src/lib/report-download.ts` — `downloadAdminReport(path, params, filename)` helper that calls an admin endpoint and triggers a browser file download. Used for inventory XLS export and any future report endpoints.

## Key Types (`src/types/`)

- `Product`, `ProductListItem`, `ProductVariant`, `ProductDiscount`, `VariantDiscountRule`, `ProductDiscountRule` — product catalogue + discount rules
- `Order`, `PublicOrder` — order with full details; `OrderStatus` union: `pending_payment | waiting_confirmation | paid | shipped | done | expired_unpaid | cancelled`
- `PaymentMethod`: `bank_transfer | credit`
- `DeliveryMethod`: `pickup | delivery`
- `Store` — store settings including QRIS and minimum order thresholds (separate retail vs store-customer thresholds); bank info is now `bankAccounts: StoreBankAccount[]`
- `StoreBankAccount` — `{ id, storeId, bankName: BankName, accountNumber, accountHolder, sortOrder }`; `BankName` enum: `BCA | BRI | BNI | Mandiri | BankPapua | BTN`; `BANK_NAME_LABELS` maps enum to display name; `BANK_NAME_OPTIONS` for `<Select>` dropdowns — all in `src/types/store.ts`
- `CustomerAddress` — saved address with optional GPS coordinates
- `CarouselSlide` — homepage carousel managed from admin
- `StockMovement`, `StockMovementCategory` — inventory ledger types (`initial_stock | add_stock | sale | restore`)
- `Inventory` — product + variant stock summary type used in `use-inventory.ts`

## SWR Hooks (`src/hooks/`)

| Hook | Endpoint | Used by |
|---|---|---|
| `useAdminDashboard` | `/admin/dashboard` | Admin dashboard page |
| `useAdminProducts` | `/admin/products` | Product list, inventory page |
| `useAdminOrders` | `/admin/orders` | Order list |
| `useAdminCustomers` | `/admin/customers` | Customer list |
| `useAdminInventoryMovements` | `/admin/inventory` | Inventory page |
| `useInventory` | `/admin/inventory` (summary) | Stock management |
| `useCategories` | `/admin/categories` | Category management |
| `useUnits` | `/admin/units` | Unit management |
| `useShippingZones` | `/admin/shipping-zones` | Shipping management |
| `useShippingDrivers` | `/admin/shipping-drivers` | Driver management |
| `useShippingShifts` | `/admin/shipping-shifts` | Shift management |
| `useStore` | `/admin/store` | Store settings |
| `useReceivables` | `/admin/receivables` | Receivables page |
| `useProducts` | `/products` | Public product listing (SWR) |

## Environment Variables

```
NEXT_PUBLIC_API_URL=      # Backend API base URL (browser + server fallback)
API_URL=                  # Backend API base URL (server-side only, preferred)

# ─── Storage (MinIO) — server-side only, NOT NEXT_PUBLIC ──────────────────────
MINIO_ENDPOINT=           # MinIO host — "minio" inside Docker, "localhost" for local dev
MINIO_PORT=               # MinIO S3 API port (9000)
MINIO_ACCESS_KEY=         # MinIO root user
MINIO_SECRET_KEY=         # MinIO root password
MINIO_BUCKET=             # Bucket name — "uploads-stg" (stg) or "uploads-prod" (prod)
MINIO_USE_SSL=            # false for local/VPS, true if behind HTTPS
MINIO_PUBLIC_URL=         # Public base URL for images — "http://localhost:9000" (local) or "http://43.129.52.166:9000" (VPS)

# ─── Build-time (NEXT_PUBLIC) ─────────────────────────────────────────────────
NEXT_PUBLIC_STORE_ID=     # Tenant storeId — used as folder prefix in MinIO uploads
NEXT_PUBLIC_IMG_MAX_SIZE_MB=    # Global image compression limit in MB (default 0.5)
NEXT_PUBLIC_IMG_MAX_WIDTH_PX=   # Global image max dimension in px (default 1200)
```

MinIO vars are **not** in GitHub Secrets — they are runtime vars injected via `docker-compose.yaml` environment or `.env.stg` on the VPS. Only `NEXT_PUBLIC_*` vars are GitHub Secrets (baked at build time).

In production (`.env.prod`), the frontend calls `API_URL=http://api:4000/api` (Docker internal) and `NEXT_PUBLIC_API_URL=/api` (browser via reverse proxy). The app is designed to run inside Docker alongside a backend container named `api`.

## Storage: Image Upload Architecture

All image uploads go through MinIO (S3-compatible). Cloudinary is no longer used.

### Upload flow
1. Client requests a presigned URL → `POST /api/upload/presign` `{ purpose, tenantId }`
2. Next.js generates a presigned PUT URL pointing to `temp/{tenantId}/{purpose}/{uuid}.ext`
3. Browser uploads the file **directly to MinIO** via the presigned URL (no file passes through Next.js)
4. Client stores the `tempKey` and shows a preview
5. On form submit → client calls `POST /api/upload/confirm` `{ tempKey }`
6. Next.js copies `temp/...` → `{tenantId}/{purpose}/{uuid}.ext`, deletes temp, returns permanent URL
7. Client sends the permanent URL to the Express API as a plain string (no change to API)

### Orphan cleanup
Endpoint: `GET /api/upload/cleanup` — deletes all objects under `temp/` older than 2 hours.
Should be called by a cron job every hour (e.g. via docker cron or system cron on VPS).

### tenantId resolution — CURRENT vs FUTURE

**Current (single tenant):**
`tenantId` is read statically from `NEXT_PUBLIC_STORE_ID` env var.

**Future (multi-tenant) — TODO:**
Each tenant will have their own domain. `tenantId` resolution should change to reading `Host` header → call `GET /api/store` → cache domain→storeId mapping.
Files to update: `app/api/upload/presign/route.ts`, `app/api/upload/confirm/route.ts`, `src/lib/storage.ts`.

## Routing Reference

```
/                           Homepage — SSR product grid + carousel + promos
/catalog                    Full catalogue with sidebar filters + category + price range
/product/[id]               Product detail with variant selector + discount hints
/cart                       Cart page (client-only, Zustand)
/checkout                   Checkout form with map-based shipping detection
/order/[publicOrderId]      Public order status page (polls every 30s via SWR) + delivery actions + complaint form
/order                      Customer order list (requires customer auth)
/promo                      Promo products listing
/login                      Customer login
/register                   Customer registration

/dashboard                  Customer account overview (avatar upload)
/dashboard/orders           Customer order history
/dashboard/address          Saved address management
/dashboard/credit           Customer credit summary
/dashboard/password         Change password

/admin/login                Admin login
/admin                      Admin dashboard (stats + recent orders)
/admin/products             Product list + management
/admin/products/new         Create product
/admin/products/[id]        Edit product (variants, images, discounts, discount rules)
/admin/orders               Order list with status filter
/admin/orders/[id]          Order detail + ship/confirm/settle-credit actions + complaint management
/admin/customers            Customer list
/admin/customers/add        Add customer manually
/admin/category             Category management
/admin/satuan               Unit (satuan) management
/admin/inventory            Stock movement history + add stock adjustment + export XLS
/admin/shipping-zones       Zone map + cost management
/admin/shipping-drivers     Delivery driver management
/admin/shipping-shifts      Delivery shift management
/admin/store                Store settings (multiple bank accounts via useFieldArray, QRIS, minimum orders); bank accounts saved via PUT /admin/store/bank-accounts (full replace)
/admin/credit               Customer credit limits + term of payment
/admin/receivables          Credit receivables (piutang) tracking
```
