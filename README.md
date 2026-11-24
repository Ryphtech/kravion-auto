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

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront, or [http://localhost:3000/admin](http://localhost:3000/admin) to view the administration dashboard.

### 3. Seed Firestore Database
```bash
npm run seed:firestore
```

### 4. Run Verification & Test Suite
```bash
npm run build
npm test
```

---

## License
MIT License. © Kravion Auto.
