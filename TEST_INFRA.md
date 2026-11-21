# E2E Test Infra: Kravion Auto

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: All test specifications are derived directly from `ORIGINAL_REQUEST.md` and user-facing contracts in `PROJECT.md`. Tests validate system behavior, contracts, inputs, outputs, error conditions, and user flows from an external perspective.
- **Methodology**: Systematic 4-tier design:
  - **Tier 1 - Feature Coverage**: Category-Partition representative cases ensuring every core feature functions correctly on valid inputs (≥5 tests per feature).
  - **Tier 2 - Boundary & Corner Cases**: Boundary Value Analysis (BVA), extreme values, empty states, malformed inputs, special characters, and stress limits (≥5 tests per feature).
  - **Tier 3 - Cross-Feature Combinations**: Pairwise Combinatorial Testing exercising multi-component interactions (e.g. Garage Selector + Product Filter + Cart; Auth Guard + Wishlist Persistence; R2 Upload + Admin Catalog + Storefront Display).
  - **Tier 4 - Real-World Application Scenarios**: Multi-step holistic end-to-end user workflows simulating actual customer shopping journeys, WhatsApp checkout redirection, payment omission verification, admin catalogue publishing, and resilience under network/database faults.

---

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 (Min) | Tier 2 (Min) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|----------------------|:------------:|:------------:|:-----------------:|:-----------------:|
| F1 | Storefront Catalog & Faceted Search/Filter | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F2 | 3-Tier Vehicle Compatibility Engine | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | Product Detail & Cloudflare R2 CDN Gallery | ORIGINAL_REQUEST §R1, R4 | 5 | 5 | ✓ | ✓ |
| F4 | Shopping Cart Operations & Totals Math | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F5 | Customer Wishlist & Item Persistence | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F6 | Customer Authentication & Pre-Checkout Guard | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F7 | WhatsApp Hand-Off URL Formatter & Disclaimer | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F8 | Order Enquiry Persistence & Payment Omission Guarantee | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F9 | Admin Catalog CRUD & Vehicle Compatibility Mapping | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F10 | Cloudflare R2 S3 Image Upload & CDN URL Generation | ORIGINAL_REQUEST §R3, R4 | 5 | 5 | ✓ | ✓ |
| F11 | Admin Banners/Posters & Store/WhatsApp Settings | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F12 | Cloud Services & Resilient Dual-Source Data Layer | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| **Total** | | | **60** | **60** | **18** | **6** |

**Grand Total Minimum Test Assertions**: 144 tests across all 4 tiers.

---

## Test Architecture

### Test Runner
- **Location**: `tests/e2e/runner.mjs`
- **Invocation**: `node tests/e2e/runner.mjs` or `npm run test:e2e`
- **Runner Features**:
  - Independent ESM test runner requiring no external heavyweight test framework dependencies.
  - Supports running all tiers or filtering by tier (`--tier=1`, `--tier=2`, `--tier=3`, `--tier=4`).
  - Colorized CLI output, detailed assertion failure traces, timing metrics, and final summary report.
  - Pass/Fail Semantics: Process exits with code `0` on 100% pass, and code `1` if any test fails.

### Directory Layout
```
c:\Users\thanz\work folder(dont delete)\ryph-tech\kravion/
└── tests/
    └── e2e/
        ├── runner.mjs                             # Test suite CLI runner and aggregator
        ├── helpers/
        │   ├── assertions.mjs                     # Assertion library (assert, deepEqual, throws, etc.)
        │   ├── mock-data.mjs                      # Deterministic fixtures for vehicles, products, orders
        │   └── test-env.mjs                       # Environment validation and mock providers
        ├── tier1-features/                        # Tier 1: Feature Coverage (>=5 per feature)
        │   ├── f1-catalog-search.test.mjs
        │   ├── f2-compatibility.test.mjs
        │   ├── f3-product-detail.test.mjs
        │   ├── f4-cart-calculations.test.mjs
        │   ├── f5-wishlist.test.mjs
        │   ├── f6-auth-guard.test.mjs
        │   ├── f7-whatsapp-url.test.mjs
        │   ├── f8-order-persistence.test.mjs
        │   ├── f9-admin-catalog.test.mjs
        │   ├── f10-r2-upload.test.mjs
        │   ├── f11-admin-settings.test.mjs
        │   └── f12-data-resilience.test.mjs
        ├── tier2-boundaries/                      # Tier 2: Boundary & Corner Cases (>=5 per feature)
        │   ├── b1-catalog-boundaries.test.mjs
        │   ├── b2-compatibility-corners.test.mjs
        │   ├── b3-product-boundaries.test.mjs
        │   ├── b4-cart-boundaries.test.mjs
        │   ├── b5-wishlist-boundaries.test.mjs
        │   ├── b6-auth-boundaries.test.mjs
        │   ├── b7-whatsapp-encoding-boundaries.test.mjs
        │   ├── b8-order-boundaries.test.mjs
        │   ├── b9-admin-crud-boundaries.test.mjs
        │   ├── b10-r2-boundaries.test.mjs
        │   ├── b11-settings-boundaries.test.mjs
        │   └── b12-resilience-boundaries.test.mjs
        ├── tier3-combinations/                    # Tier 3: Pairwise Combinations (18 tests)
        │   └── pairwise-interactions.test.mjs
        └── tier4-scenarios/                       # Tier 4: Real-World Application Scenarios (6 scenarios)
            ├── scenario1-customer-discovery-to-whatsapp.test.mjs
            ├── scenario2-admin-r2-upload-to-storefront.test.mjs
            ├── scenario3-garage-fitment-to-order-enquiry.test.mjs
            ├── scenario4-auth-wishlist-cart-sync.test.mjs
            ├── scenario5-corrupt-data-and-network-recovery.test.mjs
            └── scenario6-admin-lifecycle-and-order-management.test.mjs
```

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity | Description |
|---|----------|--------------------|------------|-------------|
| 1 | Complete Customer Journey: Discovery -> Fitment -> Cart -> WhatsApp Checkout | F1, F2, F3, F4, F6, F7, F8 | High | Customer selects BMW in Garage, filters catalog for lighting, adds compatible LED headlights to cart, logs in via email/password, proceeds to checkout, validates WhatsApp URL formatting and order enquiry record. Verifies NO payment gateway or 'paid' status exists. |
| 2 | Admin R2 Asset Upload & Storefront Catalog Publishing | F3, F9, F10, F11 | High | Admin uploads high-res wheel accessory image to Cloudflare R2, creates new product with multi-fitment compatibility and public R2 image URL, updates carousel banner, verifies product appears in storefront search. |
| 3 | Garage Fitment Matrix & Multi-Vehicle Compatibility Switching | F1, F2, F3, F4 | High | Customer tests universal vs single vs multi-fitment items while toggling garage vehicles between Audi A4, Mercedes C-Class, and BMW 3 Series. Verifies cart reflects vehicle compatibility warnings correctly. |
| 4 | Authenticated Session Sync, Wishlist Migration & Cart Persistence | F4, F5, F6 | Medium | Guest browses and adds items to cart and wishlist, authenticates with Firebase Auth, verifies cart and wishlist are merged/persisted, verifies unauthenticated access to checkout is blocked until auth. |
| 5 | Firestore Permission-Denied / Network Resilience & Seed Fallback | F1, F6, F8, F12 | High | Simulates Firestore offline or security rules rejecting queries. Verifies application gracefully falls back to bundled seed catalog, provides read-only fallback or local session queue, and does not crash. |
| 6 | Admin Order Enquiry Lifecycle & Store Configuration Update | F7, F8, F9, F11 | Medium | Customer submits enquiry, Admin views enquiry in dashboard, clicks generated WhatsApp reply link, updates store contact phone, and verifies subsequent checkout uses the newly configured phone. |

---

## Coverage Thresholds
- **Tier 1**: ≥5 per feature (60 tests total across 12 features)
- **Tier 2**: ≥5 per feature (60 tests total across 12 features)
- **Tier 3**: ≥18 pairwise combinatorial tests
- **Tier 4**: 6 end-to-end realistic application scenarios
- **Acceptance Gate**: 100% pass rate (`exit code 0`, 0 failing tests) when executed via `node tests/e2e/runner.mjs`.
