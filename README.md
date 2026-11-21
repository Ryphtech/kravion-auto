# kravion-auto

> High-end, responsive luxury e-commerce platform for automobile accessories and performance styling parts. Built with Next.js 14 (App Router), Tailwind CSS, Firebase Firestore & Authentication, Cloudflare R2 object storage, and a VIP zero-payment WhatsApp concierge order hand-off.

---

## Key Features

- **Luxury Light-Mode Design System**:
  - Automotive OEM+ aesthetic inspired by Porsche Design and Brembo Sport styling.
  - Google Fonts `Plus Jakarta Sans` for bold headlines and `Inter` for microcopy and technical badges.
  - Crimson Sport Red (`#DC2626`), Deep Slate (`#0F172A`), and Crisp Slate borders (`#E2E8F0`).
- **3-Tier Vehicle Compatibility Engine**:
  - **Universal Fit**: Auto accessories that fit all standard automobiles.
  - **Single Vehicle**: Specific chassis & generation fitment guarantee (e.g. BMW M3 G80, Porsche 911 992).
  - **Multi-Vehicle**: Mapped to selected makes, generations, or model lines.
  - Interactive **"My Garage"** vehicle selector with live real-time fitment indicators.
- **WhatsApp Concierge Order Hand-Off**:
  - Zero automated credit card collection or gateway fees.
  - Prepares structured, encoded WhatsApp messages containing customer shipping details, vehicle context, line items, and fitment notes.
  - Opens direct line to Kravion Auto concierge for pro-forma invoicing and dispatch verification.
- **Cloudflare R2 Object Storage**:
  - Direct image uploading to Cloudflare R2 S3-compatible bucket (`kravion-auto`).
  - High-speed delivery via Cloudflare public CDN.
- **Dual-Source Resilient Data Architecture**:
  - Google Firebase Cloud Firestore database for real-time live data persistence.
  - Ultra-resilient in-memory seed catalog fallback ensuring 100% operational uptime if offline or during rule updates.
- **Administrative Command Center (`/admin`)**:
  - Product Catalog management (Add, Edit, Delete, Stock and Featured toggles).
  - Cloudflare R2 Drag-and-Drop Image Uploader.
  - Vehicle Directory management (Makes, models, chassis codes, and year ranges).
  - Category and Carousel Poster management.
  - Order Enquiries management with one-click WhatsApp reply builder.
  - Global Store & WhatsApp contact routing configuration.

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Firebase Firestore & Firebase Auth](https://firebase.google.com/)
- **Object Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via `@aws-sdk/client-s3`
- **Testing**: Native Node.js test runner with 160 E2E assertions across 31 test suites

---

## Getting Started

### 1. Installation
```bash
git clone https://github.com/Ryphtech/kravion-auto.git
cd kravion-auto
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAf-rGHLZHG0VUtpgN811UjetBhUTTfu74
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kravion-auto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kravion-auto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kravion-auto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=162661378547
NEXT_PUBLIC_FIREBASE_APP_ID=1:162661378547:web:2e7040bd9ddc2914ebca86

# Cloudflare R2 Object Storage
R2_ACCESS_KEY_ID=1053aa24d7e128cff5da3170ec228598
R2_SECRET_ACCESS_KEY=2d27a5f60d5c05a4fedea489f4f2f1d8d2d54fc8286878fddee7665cf7f7bece
R2_S3_ENDPOINT=https://d6e0e618a594c39ee7bf96cd59297564.r2.cloudflarestorage.com
R2_BUCKET_NAME=kravion-auto
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront, or [http://localhost:3000/admin](http://localhost:3000/admin) to view the administration dashboard.

### 4. Seed Firestore Database
```bash
npm run seed:firestore
```

### 5. Run Verification & Test Suite
```bash
npm run build
npm test
node scripts/verify-cloud.mjs
```

---

## License
MIT License. © Kravion Auto.
