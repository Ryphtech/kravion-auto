/**
 * Production-quality mock data and test fixtures for Kravion Auto E2E Test Suite.
 */

export const R2_PUBLIC_BASE_URL = 'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev';

export const mockVehicles = [
  {
    id: 'bmw-3-g20',
    make: 'BMW',
    model: '3 Series (G20/G21)',
    yearRange: '2019-2024',
    slug: 'bmw-3-series-g20',
    generation: 'G20',
  },
  {
    id: 'bmw-m4-g82',
    make: 'BMW',
    model: 'M4 Coupe (G82)',
    yearRange: '2021-2024',
    slug: 'bmw-m4-g82',
    generation: 'G82',
  },
  {
    id: 'bmw-x5-g05',
    make: 'BMW',
    model: 'X5 (G05)',
    yearRange: '2019-2024',
    slug: 'bmw-x5-g05',
    generation: 'G05',
  },
  {
    id: 'audi-a4-b9',
    make: 'Audi',
    model: 'A4 Sedan (B9/B9.5)',
    yearRange: '2016-2024',
    slug: 'audi-a4-b9',
    generation: 'B9',
  },
  {
    id: 'audi-q7-4m',
    make: 'Audi',
    model: 'Q7 SUV (4M)',
    yearRange: '2016-2024',
    slug: 'audi-q7-4m',
    generation: '4M',
  },
  {
    id: 'audi-rs6-c8',
    make: 'Audi',
    model: 'RS6 Avant (C8)',
    yearRange: '2020-2024',
    slug: 'audi-rs6-c8',
    generation: 'C8',
  },
  {
    id: 'mb-c-w206',
    make: 'Mercedes-Benz',
    model: 'C-Class Sedan (W206)',
    yearRange: '2022-2024',
    slug: 'mercedes-benz-c-class-w206',
    generation: 'W206',
  },
  {
    id: 'mb-e-w213',
    make: 'Mercedes-Benz',
    model: 'E-Class Sedan (W213)',
    yearRange: '2017-2023',
    slug: 'mercedes-benz-e-class-w213',
    generation: 'W213',
  },
  {
    id: 'mb-g-w463',
    make: 'Mercedes-Benz',
    model: 'G-Class Wagon (W463A)',
    yearRange: '2019-2024',
    slug: 'mercedes-benz-g-class-w463',
    generation: 'W463A',
  },
  {
    id: 'porsche-911-992',
    make: 'Porsche',
    model: '911 Carrera (992)',
    yearRange: '2020-2024',
    slug: 'porsche-911-992',
    generation: '992',
  },
  {
    id: 'porsche-cayenne-9ya',
    make: 'Porsche',
    model: 'Cayenne SUV (9YA)',
    yearRange: '2018-2024',
    slug: 'porsche-cayenne-9ya',
    generation: '9YA',
  },
];

export const mockCategories = [
  {
    id: 'lighting',
    name: 'Lighting & Headlights',
    slug: 'lighting',
    description: 'High performance Laser LED headlights, OLED tail lamps, and dynamic turn indicators.',
    icon: 'Zap',
    itemCount: 14,
  },
  {
    id: 'exterior',
    name: 'Exterior Styling & Aero',
    slug: 'exterior',
    description: 'Pre-preg carbon fiber splitters, diffusers, mirror caps, and ducktail spoilers.',
    icon: 'Shield',
    itemCount: 22,
  },
  {
    id: 'interior',
    name: 'Interior Accessories',
    slug: 'interior',
    description: 'Ergonomic Nappa leather cushions, ambient illumination packs, and paddle shifters.',
    icon: 'Sliders',
    itemCount: 18,
  },
  {
    id: 'performance',
    name: 'Performance & Tuning',
    slug: 'performance',
    description: 'Cold air intake systems, titanium exhaust downpipes, and suspension stabilization.',
    icon: 'Gauge',
    itemCount: 10,
  },
  {
    id: 'wheels',
    name: 'Wheels & Accessories',
    slug: 'wheels',
    description: 'Monoblock forged wheels, titanium lug nuts, and center-lock aero covers.',
    icon: 'Disc',
    itemCount: 12,
  },
];

export const mockProducts = [
  // 1. Single Compatibility Product
  {
    id: 'prod-single-bmw-lip',
    title: 'BMW G20 3-Series Carbon Fiber M-Sport Front Splitter',
    slug: 'bmw-g20-carbon-front-splitter',
    price: 489.0,
    compareAtPrice: 599.0,
    categoryId: 'exterior',
    categoryName: 'Exterior Styling & Aero',
    description: 'Vacuum-infused 2x2 weave dry carbon fiber front spoiler engineered specifically for BMW G20 3 Series.',
    images: [
      `${R2_PUBLIC_BASE_URL}/products/bmw-g20-lip-front.webp`,
      `${R2_PUBLIC_BASE_URL}/products/bmw-g20-lip-angle.webp`,
    ],
    specs: {
      dimensions: '182 x 45 x 12 cm',
      weight: '2.4 kg',
      material: 'Dry Carbon Fiber (2x2 Weave)',
      warranty: '2-Year Kravion Limited Warranty',
    },
    ratings: {
      rating: 4.9,
      reviewCount: 38,
    },
    stock: {
      status: 'in_stock',
      inventory: 15,
    },
    compatibility: {
      type: 'single',
      vehicleId: 'bmw-3-g20',
      compatibleMakes: ['BMW'],
    },
    featured: true,
  },

  // 2. Multi Compatibility Product
  {
    id: 'prod-multi-german-led',
    title: 'German Executive Sequential Dynamic Mirror LED Indicators',
    slug: 'german-executive-sequential-mirror-led',
    price: 135.0,
    compareAtPrice: 175.0,
    categoryId: 'lighting',
    categoryName: 'Lighting & Headlights',
    description: 'High output smoked amber sequential LED turn signal indicators engineered for German sedans.',
    images: [
      `${R2_PUBLIC_BASE_URL}/products/german-mirror-led-main.webp`,
      `${R2_PUBLIC_BASE_URL}/products/german-mirror-led-action.webp`,
    ],
    specs: {
      dimensions: '22 x 6 x 4 cm',
      weight: '0.35 kg',
      material: 'Polycarbonate & SMD LED Matrix',
      warranty: '3-Year Kravion Limited Warranty',
    },
    ratings: {
      rating: 4.8,
      reviewCount: 64,
    },
    stock: {
      status: 'in_stock',
      inventory: 40,
    },
    compatibility: {
      type: 'multi',
      vehicleIds: ['bmw-3-g20', 'bmw-m4-g82', 'audi-a4-b9', 'mb-c-w206'],
      compatibleMakes: ['BMW', 'Audi', 'Mercedes-Benz'],
    },
    featured: true,
  },

  // 3. Universal Compatibility Product
  {
    id: 'prod-universal-ceramic-kit',
    title: 'Kravion Ultra-Hydrophobic 9H Ceramic Coating Protection Kit',
    slug: 'kravion-ultra-hydrophobic-9h-ceramic-coating-kit',
    price: 89.0,
    compareAtPrice: 120.0,
    categoryId: 'exterior',
    categoryName: 'Exterior Styling & Aero',
    description: 'Multi-year nano-ceramic paint protection shield repellent to UV rays, acid rain, and micro-scratches.',
    images: [
      `${R2_PUBLIC_BASE_URL}/products/ceramic-kit-box.webp`,
      `${R2_PUBLIC_BASE_URL}/products/ceramic-kit-bottles.webp`,
    ],
    specs: {
      dimensions: '20 x 15 x 6 cm',
      weight: '0.65 kg',
      material: 'Silicon Dioxide (SiO2) 9H Formula',
      warranty: '5-Year Kravion Surface Durability Warranty',
    },
    ratings: {
      rating: 4.95,
      reviewCount: 112,
    },
    stock: {
      status: 'in_stock',
      inventory: 120,
    },
    compatibility: {
      type: 'universal',
      vehicleIds: [],
      compatibleMakes: [],
    },
    featured: true,
  },

  // 4. Single Compatibility (Audi A4)
  {
    id: 'prod-single-audi-diffuser',
    title: 'Audi A4 B9 Gloss Black Rear Bumper Aero Diffuser',
    slug: 'audi-a4-b9-gloss-black-diffuser',
    price: 320.0,
    compareAtPrice: 380.0,
    categoryId: 'exterior',
    categoryName: 'Exterior Styling & Aero',
    description: 'Aggressive twin-fin rear diffuser replacement with precision clip-on fitment for Audi A4 B9.',
    images: [
      `${R2_PUBLIC_BASE_URL}/products/audi-a4-diffuser.webp`,
    ],
    specs: {
      dimensions: '140 x 30 x 18 cm',
      weight: '3.1 kg',
      material: 'Automotive Grade ABS Plastic',
      warranty: '2-Year Limited Warranty',
    },
    ratings: {
      rating: 4.7,
      reviewCount: 21,
    },
    stock: {
      status: 'in_stock',
      inventory: 8,
    },
    compatibility: {
      type: 'single',
      vehicleId: 'audi-a4-b9',
      compatibleMakes: ['Audi'],
    },
    featured: false,
  },

  // 5. Multi Compatibility (Porsche 911 & Cayenne)
  {
    id: 'prod-multi-porsche-exhaust',
    title: 'Porsche Sport Design Titanium Dual Exhaust Tips (Pair)',
    slug: 'porsche-sport-titanium-exhaust-tips',
    price: 650.0,
    compareAtPrice: 750.0,
    categoryId: 'performance',
    categoryName: 'Performance & Tuning',
    description: 'Lightweight brushed titanium dual exhaust outlets with blue-annealed finish for Porsche models.',
    images: [
      `${R2_PUBLIC_BASE_URL}/products/porsche-titanium-tips.webp`,
    ],
    specs: {
      dimensions: '35 x 20 x 12 cm',
      weight: '1.8 kg',
      material: 'Grade 5 Aerospace Titanium',
      warranty: 'Lifetime Craftsmanship Warranty',
    },
    ratings: {
      rating: 5.0,
      reviewCount: 19,
    },
    stock: {
      status: 'low_stock',
      inventory: 3,
    },
    compatibility: {
      type: 'multi',
      vehicleIds: ['porsche-911-992', 'porsche-cayenne-9ya'],
      compatibleMakes: ['Porsche'],
    },
    featured: true,
  },

  // 6. Universal Interior Product
  {
    id: 'prod-universal-nappa-cushion',
    title: 'Kravion Ergonomic Nappa Leather Memory Foam Lumbar Cushion',
    slug: 'kravion-ergonomic-nappa-leather-lumbar-cushion',
    price: 65.0,
    compareAtPrice: 85.0,
    categoryId: 'interior',
    categoryName: 'Interior Accessories',
    description: 'Perforated genuine Nappa leather cushion with slow-rebound memory foam core.',
    images: [
      `${R2_PUBLIC_BASE_URL}/products/nappa-cushion-black.webp`,
    ],
    specs: {
      dimensions: '40 x 38 x 10 cm',
      weight: '0.85 kg',
      material: 'Perforated Nappa Leather + Memory Foam',
      warranty: '1-Year Limited Warranty',
    },
    ratings: {
      rating: 4.85,
      reviewCount: 88,
    },
    stock: {
      status: 'in_stock',
      inventory: 75,
    },
    compatibility: {
      type: 'universal',
      vehicleIds: [],
      compatibleMakes: [],
    },
    featured: false,
  },
];

export const mockUserSessions = {
  guestUser: null,

  customerUser: {
    uid: 'usr-cust-9912',
    email: 'marcus.vance@example.com',
    displayName: 'Marcus Vance',
    token: 'mock-jwt-customer-token-1234567890',
    providerId: 'password',
    role: 'customer',
  },

  googleUser: {
    uid: 'usr-google-8831',
    email: 'sarah.connor@gmail.com',
    displayName: 'Sarah Connor',
    token: 'mock-google-oauth2-token-987654321',
    providerId: 'google.com',
    role: 'customer',
  },

  adminUser: {
    uid: 'usr-admin-0001',
    email: 'admin@kravion.com',
    displayName: 'Kravion Head Administrator',
    token: 'mock-jwt-admin-token-supersecure',
    providerId: 'password',
    role: 'admin',
  },
};

export const mockOrders = [
  {
    id: 'order-krav-9801',
    orderNumber: 'KRAV-9801',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (555) 234-5678',
    customerEmail: 'marcus.vance@example.com',
    shippingAddress: {
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      country: 'United States',
    },
    vehicleDetails: {
      make: 'BMW',
      model: '3 Series (G20/G21)',
      year: '2022',
    },
    items: [
      {
        productId: 'prod-single-bmw-lip',
        title: 'BMW G20 3-Series Carbon Fiber M-Sport Front Splitter',
        price: 489.0,
        quantity: 1,
        subtotal: 489.0,
      },
      {
        productId: 'prod-universal-ceramic-kit',
        title: 'Kravion Ultra-Hydrophobic 9H Ceramic Coating Protection Kit',
        price: 89.0,
        quantity: 2,
        subtotal: 178.0,
      },
    ],
    subtotal: 667.0,
    tax: 53.36,
    shipping: 0.0, // Free shipping threshold met (> $100)
    totalAmount: 720.36,
    status: 'enquiry_placed',
    notes: 'Please ensure packaging is reinforced for carbon splitter.',
    paymentMethod: 'none',
    paymentStatus: 'pending_manual_quote',
    createdAt: '2026-11-20T16:00:00.000Z',
  },
];

export const mockAdminSettings = {
  storeName: 'Kravion Auto Accessories & Parts',
  supportEmail: 'support@kravion.com',
  contactPhone: '+91 98765 43210',
  whatsappNumber: '919876543210',
  address: 'Level 4, Kravion Tower, Automotive Way, Cyber City',
  currency: 'USD',
  freeShippingThreshold: 100.0,
  taxRatePercent: 8.0,
  defaultShippingCost: 15.0,
};

export const mockCarouselPosters = [
  {
    id: 'banner-hero-1',
    title: 'Aerodynamic Precision Carbon Fiber',
    subtitle: 'Tailored for German Engineering Excellence: BMW, Audi, Mercedes',
    imageUrl: `${R2_PUBLIC_BASE_URL}/banners/hero-carbon-aero.webp`,
    link: '/products?category=exterior',
    order: 1,
    isActive: true,
  },
  {
    id: 'banner-hero-2',
    title: 'Illuminated Dynamic Sequential Optics',
    subtitle: 'Upgrade your vehicle presence with OEM-grade LED optics',
    imageUrl: `${R2_PUBLIC_BASE_URL}/banners/hero-dynamic-lights.webp`,
    link: '/products?category=lighting',
    order: 2,
    isActive: true,
  },
  {
    id: 'banner-hero-3',
    title: 'Universal Kravion Pro Detailing Collection',
    subtitle: 'Laboratory-grade 9H ceramic coatings and luxury Nappa accessories',
    imageUrl: `${R2_PUBLIC_BASE_URL}/banners/hero-detailing-kit.webp`,
    link: '/products?category=interior',
    order: 3,
    isActive: true,
  },
];
