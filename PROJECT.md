# Project: Kravion Auto

## Architecture
Kravion Auto is a production-ready automotive accessories and parts e-commerce web application.
- **Framework**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide React icons.
- **Database & Auth**: Firebase Firestore (resilient dual-source architecture with bundled seed catalog fallback) & Firebase Authentication (Email/Password + Google Sign-In).
- **Storage**: Cloudflare R2 Object Storage (S3-compatible API using `@aws-sdk/client-s3`) with public distribution via `https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev`.
- **Order Engine**: WhatsApp Order Hand-off engine generating formatted `https://wa.me/<number>?text=...` checkout redirects with zero online payment collection and Firestore enquiry logging.
- **Administration**: Role-protected Admin Dashboard managing catalogue, compatibility rules, R2 image uploads, homepage banners, categories, and order enquiries.

### Directory Layout
```
c:\Users\thanz\work folder(dont delete)\ryph-tech\kravion/
├── src/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── page.tsx                     # Homepage (Hero carousel, makes, categories, featured)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx                 # Product catalog & search/filter
│   │   │   │   └── [id]/page.tsx            # Product detail page (R2 gallery, specs, fitment)
│   │   │   ├── cart/page.tsx                # Shopping cart
│   │   │   ├── checkout/page.tsx            # Checkout & WhatsApp hand-off
│   │   │   └── wishlist/page.tsx            # Customer wishlist
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx               # Firebase Auth login
│   │   │   └── register/page.tsx            # Firebase Auth registration
│   │   ├── admin/
│   │   │   ├── layout.tsx                   # Admin sidebar & auth guard
│   │   │   ├── page.tsx                     # Dashboard overview
│   │   │   ├── products/page.tsx            # Product CRUD & compatibility mapping
│   │   │   ├── categories/page.tsx          # Categories CRUD
│   │   │   ├── vehicles/page.tsx            # Vehicles CRUD
│   │   │   ├── banners/page.tsx             # Carousel banners CRUD
│   │   │   ├── orders/page.tsx              # Order enquiries list
│   │   │   └── settings/page.tsx            # Store & WhatsApp settings
│   │   ├── api/
│   │   │   ├── admin/upload/route.ts        # Server-side Cloudflare R2 S3 image upload
│   │   │   ├── orders/route.ts              # Order enquiry API
│   │   │   └── health/route.ts              # Health check endpoint
│   │   ├── layout.tsx                       # Root layout & providers
│   │   └── globals.css                      # Global styles & Tailwind
│   ├── components/
│   │   ├── layout/                          # Header, Footer, Navigation, GarageModal
│   │   ├── storefront/                      # ProductCard, Carousel, MakeGrid, FilterSidebar
│   │   ├── ui/                              # Buttons, Inputs, Modals, Badges, Toast
│   │   └── admin/                           # ImageUploader, CompatibilitySelector, OrderDetail
│   ├── context/
│   │   ├── AuthContext.tsx                  # Firebase Auth state & methods
│   │   ├── CartContext.tsx                  # Shopping cart state & persistence
│   │   ├── WishlistContext.tsx              # Customer wishlist state
│   │   └── GarageContext.tsx                # Selected vehicle context ("My Garage")
│   ├── lib/
│   │   ├── firebase.ts                      # Firebase App, Auth, and Firestore initialization
│   │   ├── r2.ts                            # Cloudflare R2 S3 client configuration
│   │   ├── data-service.ts                  # Dual-source data layer (Firestore + Seed Fallback)
│   │   ├── seed-data.ts                     # Rich production-ready seed catalog
│   │   ├── compatibility.ts                 # 3-tier vehicle compatibility calculation engine
│   │   ├── whatsapp.ts                      # WhatsApp message formatter & URL builder
│   │   └── utils.ts                         # Formatting, currency, cn helper
│   └── types/
│       └── index.ts                         # Complete TypeScript domain schemas
├── scripts/
│   ├── verify-cloud.mjs                     # Automated R2, Firebase Auth & WhatsApp verification
│   └── seed.mjs                             # Database seeding utility
├── public/                                  # Static assets and icons
├── next.config.mjs                          # Next.js config with R2 remotePatterns
├── tailwind.config.ts                       # Tailwind styling config
├── tsconfig.json                            # TypeScript configuration
└── package.json                             # Dependencies and scripts
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Project Initialization | Next.js 14 App Router, Tailwind CSS, TypeScript, dependencies | M1 | survey |
| 2 | Cloudflare R2 S3 Client | AWS SDK v3 S3 client for `kravion-auto` bucket | M1 | survey |
| 3 | Cloudflare R2 Upload Route | Server route `/api/admin/upload` uploading to R2 and returning public CDN URL | M1 | survey |
| 4 | Next.js Image Config | `images.remotePatterns` for `pub-bd9a15bceb394e7b95f90e4967940403.r2.dev` | M1 | survey |
| 5 | Firebase Client Setup | Firebase App, Auth, and Firestore client initialization | M1 | survey |
| 6 | Dual-Source Data Layer | Service layer querying Firestore with resilient seed fallback on permission-denied | M1 | survey |
| 7 | TypeScript Domain Schemas | Vehicle, ProductCompatibility, Product, Category, Order, User types | M1 | survey |
| 8 | Seed Catalog | 16 vehicles, 5 categories, 16 multi-compatibility products, 4 banners, settings | M1 | survey |
| 9 | Cloud Verification Suite | Standalone script verifying R2 upload/read/delete, Auth, and WhatsApp URL | M1 | survey |
| 10 | 3-Tier Vehicle Compatibility | Engine calculating `single`, `multi`, and `universal` fitment rules | M2 | survey |
| 11 | "My Garage" Vehicle Selector | Header selector with persistent vehicle fitment badge indicators | M2 | survey |
| 12 | Homepage Carousel Posters | Hero carousel with seeded automotive banners and responsive slides | M2 | survey |
| 13 | Makes & Categories Navigation | Homepage quick-filter grids for Audi, Mercedes, BMW, Porsche and categories | M2 | survey |
| 14 | Product Discovery & Search | Faceted filter by vehicle make/model, product category, search query | M2 | survey |
| 15 | Product Detail View | R2 image gallery, specifications table, ratings, and compatibility verification | M2 | survey |
| 16 | Customer Authentication | Firebase Auth Email/Password & Google Sign-In with protected session state | M3 | survey |
| 17 | Customer Wishlist | Wishlist saving, removing, and customer account persistence | M3 | survey |
| 18 | Shopping Cart System | Adding items, quantity management, removal, and real-time total calculations | M3 | survey |
| 19 | Pre-Checkout Auth Guard | Gating checkout so only authenticated customers can proceed | M3 | survey |
| 20 | WhatsApp Hand-off Engine | Formatted WhatsApp message and encoded `https://wa.me/` redirect | M3 | survey |
| 21 | Order Enquiry Persistence | Storing order records in Firestore `orders` collection (`status: 'enquiry_placed'`) | M3 | survey |
| 22 | Configurable WhatsApp Phone | Recipient phone resolved from environment variable or admin settings | M3 | survey |
| 23 | Admin Dashboard Layout | Role-protected admin shell, responsive sidebar, and navigation | M4 | survey |
| 24 | Admin Products CRUD | Product creation/editing with compatibility selector, specs, and price | M4 | survey |
| 25 | Admin R2 Image Upload | Drag-and-drop or file upload to Cloudflare R2 storing public CDN URL | M4 | survey |
| 26 | Admin Categories CRUD | Creation, updating, and removal of catalogue categories | M4 | survey |
| 27 | Admin Vehicle Directory CRUD | Management of supported vehicle makes, models, and year ranges | M4 | survey |
| 28 | Admin Posters/Carousel CRUD | Uploading and configuring homepage hero carousel slides | M4 | survey |
| 29 | Admin Order Enquiries View | Inspection of customer orders with one-click WhatsApp chat link | M4 | survey |
| 30 | Admin Settings Management | Configuration of store contact details and WhatsApp recipient phone | M4 | survey |
| 31 | Production Build Verification | Zero-error Next.js production build (`npm run build`) | M5 | survey |
| 32 | E2E Test Suite Execution | Automated verification across Tiers 1-4 published in TEST_READY.md | M5 | survey |
| 33 | Adversarial Coverage Hardening | White-box stress-testing and Tier 5 boundary hardening | M5 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Foundations & Cloud Services | Project init, R2 S3 client & upload route, Firebase Auth/Firestore dual-source data layer, TypeScript schemas, seed catalog, verify-cloud script | none | DONE |
| M2 | Vehicle Compatibility & Storefront Discovery | 3-tier compatibility engine, My Garage selector, Homepage carousel & showcases, Product catalog search/filtering, Product detail page | M1 | DONE |
| M3 | Customer Accounts, Cart & WhatsApp Checkout | Firebase Auth UI, Wishlist, Shopping Cart, Pre-checkout auth gate, WhatsApp Order Hand-off Engine, Order enquiry logging | M1, M2 | DONE |
| M4 | Administrative Dashboard | Admin dashboard shell, Products CRUD with R2 upload & compatibility selector, Categories CRUD, Vehicles CRUD, Posters CRUD, Order enquiries & Settings | M1, M2, M3 | DONE |
| M5 | Final Milestone: E2E Acceptance & Adversarial Hardening | Clean production build (`npm run build`), 100% E2E test pass (Tiers 1-4), Tier 5 adversarial testing | M1, M2, M3, M4 | DONE |

## Interface Contracts

### Cloudflare R2 Upload Contract (`/api/admin/upload`)
- **Method**: `POST` multipart/form-data
- **Body**: `file: File`
- **Response**: `{ success: boolean, url: string, key: string, error?: string }`
- **Output URL Format**: `https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/${key}`

### Vehicle Compatibility Contract (`lib/compatibility.ts`)
- **Input**: `(product: Product, selectedVehicle: Vehicle | null)`
- **Output**: `{ compatible: boolean, reason: 'universal' | 'exact_match' | 'multi_match' | 'incompatible' | 'select_vehicle', label: string }`
- **Rule Hierarchy**:
  1. If `product.compatibility.type === 'universal'` -> `compatible: true, reason: 'universal', label: 'Universal Fit'`
  2. If `selectedVehicle === null` -> `compatible: true, reason: 'select_vehicle', label: 'Select Vehicle to Check Fit'`
  3. If `product.compatibility.type === 'single'` -> match on `vehicleId`
  4. If `product.compatibility.type === 'multi'` -> match on `vehicleIds.includes(selectedVehicle.id)` or `compatibleMakes.includes(selectedVehicle.make)`

### WhatsApp Order Hand-off Contract (`lib/whatsapp.ts`)
- **Input**: `(order: OrderEnquiry, recipientPhone: string)`
- **Output**: `string` (complete `https://wa.me/<CLEAN_PHONE>?text=<URL_ENCODED_MESSAGE>`)
- **Message Content**: Order reference ID (`KRAV-XXXXX`), customer name, phone, shipping address, vehicle details, itemized list (name, qty, unit price, subtotal), total amount, and explicit disclaimer that payment is pending manual confirmation.

### Data Layer Contract (`lib/data-service.ts`)
- `getProducts(filter?: ProductFilter): Promise<Product[]>`
- `getProductById(id: string): Promise<Product | null>`
- `getCategories(): Promise<Category[]>`
- `getVehicles(): Promise<Vehicle[]>`
- `getPosters(): Promise<CarouselPoster[]>`
- `createOrderEnquiry(order: CreateOrderDTO): Promise<{ id: string, whatsappUrl: string }>`
- `getOrders(): Promise<OrderEnquiry[]>`
- `saveProduct(product: Partial<Product>): Promise<string>`
- `deleteProduct(id: string): Promise<void>`
- *Resilience Guarantee*: If Firestore client rejects with permission error, service transparently returns seed catalog data or commits to in-memory/localStorage session so app never crashes.
