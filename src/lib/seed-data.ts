import {
  Vehicle,
  Category,
  Product,
  CarouselPoster,
  StoreSettings,
} from '@/types';

export const initialVehicles: Vehicle[] = [
  // Audi (4)
  {
    id: 'audi-a4',
    make: 'Audi',
    model: 'A4',
    generation: 'B9',
    yearStart: 2016,
    yearEnd: 2023,
    yearRange: '2016-2023',
    bodyStyles: ['Sedan', 'Avant'],
    imageUrl:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'audi-a6',
    make: 'Audi',
    model: 'A6',
    generation: 'C8',
    yearStart: 2019,
    yearEnd: 2024,
    yearRange: '2019-2024',
    bodyStyles: ['Sedan', 'Avant'],
    imageUrl:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'audi-q5',
    make: 'Audi',
    model: 'Q5',
    generation: 'FY',
    yearStart: 2018,
    yearEnd: 2024,
    yearRange: '2018-2024',
    bodyStyles: ['SUV', 'Sportback'],
    imageUrl:
      'https://images.unsplash.com/photo-1541348263662-e0c82661ba0c?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'audi-q7',
    make: 'Audi',
    model: 'Q7',
    generation: '4M',
    yearStart: 2016,
    yearEnd: 2024,
    yearRange: '2016-2024',
    bodyStyles: ['SUV'],
    imageUrl:
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=600&auto=format&fit=crop',
  },

  // Mercedes-Benz (4)
  {
    id: 'mercedes-c-class',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    generation: 'W205',
    yearStart: 2015,
    yearEnd: 2021,
    yearRange: '2015-2021',
    bodyStyles: ['Sedan', 'Coupe'],
    imageUrl:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'mercedes-e-class',
    make: 'Mercedes-Benz',
    model: 'E-Class',
    generation: 'W213',
    yearStart: 2017,
    yearEnd: 2023,
    yearRange: '2017-2023',
    bodyStyles: ['Sedan', 'Wagon'],
    imageUrl:
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'mercedes-glc',
    make: 'Mercedes-Benz',
    model: 'GLC',
    generation: 'X253',
    yearStart: 2016,
    yearEnd: 2022,
    yearRange: '2016-2022',
    bodyStyles: ['SUV', 'Coupe'],
    imageUrl:
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'mercedes-gle',
    make: 'Mercedes-Benz',
    model: 'GLE',
    generation: 'V167',
    yearStart: 2020,
    yearEnd: 2024,
    yearRange: '2020-2024',
    bodyStyles: ['SUV', 'Coupe'],
    imageUrl:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=600&auto=format&fit=crop',
  },

  // BMW (4)
  {
    id: 'bmw-3-series',
    make: 'BMW',
    model: '3 Series',
    generation: 'G20',
    yearStart: 2019,
    yearEnd: 2024,
    yearRange: '2019-2024',
    bodyStyles: ['Sedan', 'Touring'],
    imageUrl:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'bmw-5-series',
    make: 'BMW',
    model: '5 Series',
    generation: 'G30',
    yearStart: 2017,
    yearEnd: 2023,
    yearRange: '2017-2023',
    bodyStyles: ['Sedan', 'Touring'],
    imageUrl:
      'https://images.unsplash.com/photo-1555353540-64580b51c258?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'bmw-x3',
    make: 'BMW',
    model: 'X3',
    generation: 'G01',
    yearStart: 2018,
    yearEnd: 2024,
    yearRange: '2018-2024',
    bodyStyles: ['SUV'],
    imageUrl:
      'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'bmw-x5',
    make: 'BMW',
    model: 'X5',
    generation: 'G05',
    yearStart: 2019,
    yearEnd: 2024,
    yearRange: '2019-2024',
    bodyStyles: ['SUV'],
    imageUrl:
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&auto=format&fit=crop',
  },

  // Porsche (4)
  {
    id: 'porsche-macan',
    make: 'Porsche',
    model: 'Macan',
    generation: '95B',
    yearStart: 2015,
    yearEnd: 2024,
    yearRange: '2015-2024',
    bodyStyles: ['Compact SUV'],
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'porsche-cayenne',
    make: 'Porsche',
    model: 'Cayenne',
    generation: '9YA',
    yearStart: 2018,
    yearEnd: 2024,
    yearRange: '2018-2024',
    bodyStyles: ['SUV', 'Coupe'],
    imageUrl:
      'https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'porsche-911',
    make: 'Porsche',
    model: '911',
    generation: '992',
    yearStart: 2019,
    yearEnd: 2024,
    yearRange: '2019-2024',
    bodyStyles: ['Coupe', 'Cabriolet'],
    imageUrl:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'porsche-panamera',
    make: 'Porsche',
    model: 'Panamera',
    generation: '971',
    yearStart: 2017,
    yearEnd: 2023,
    yearRange: '2017-2023',
    bodyStyles: ['Sedan', 'Sport Turismo'],
    imageUrl:
      'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?q=80&w=600&auto=format&fit=crop',
  },
];

export const initialCategories: Category[] = [
  {
    id: 'ambient-lighting',
    name: 'Ambient Lighting',
    slug: 'ambient-lighting',
    description:
      'Precision dynamic 64-color interior ambient lights, laser headlights, and welcome puddle projection lamps.',
    imageUrl:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    displayOrder: 1,
    featured: true,
  },
  {
    id: 'audio-speakers',
    name: 'Audio & Speakers',
    slug: 'audio-speakers',
    description:
      'Rotary motorized 3D tweeters, custom-fit subwoofer enclosures, DSP amplifiers, and acoustic clarity upgrades.',
    imageUrl:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop',
    displayOrder: 2,
    featured: true,
  },
  {
    id: 'interior-accessories',
    name: 'Interior Accessories',
    slug: 'interior-accessories',
    description:
      'Faceted crystal gear shifters, Alcantara steering covers, Qi2 fast charging mounts, and precision radar sentries.',
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    displayOrder: 3,
    featured: true,
  },
  {
    id: 'carbon-fiber-styling',
    name: 'Carbon Fiber Styling',
    slug: 'carbon-fiber-styling',
    description:
      'Handcrafted autoclave dry carbon front splitters, rear diffusers, mirror housings, and track swan-neck wings.',
    imageUrl:
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800&auto=format&fit=crop',
    displayOrder: 4,
    featured: true,
  },
  {
    id: 'performance-exhausts',
    name: 'Performance Exhausts',
    slug: 'performance-exhausts',
    description:
      'Valvetronic titanium & stainless steel catback exhausts, downpipes, quad exhaust tips, and acoustic valves.',
    imageUrl:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800&auto=format&fit=crop',
    displayOrder: 5,
    featured: true,
  },
];

export const initialProducts: Product[] = [
  // 1. Single fitment: Audi A4 Carbon Diffuser
  {
    id: 'prod-audi-a4-diffuser',
    title: 'Audi A4 B9 Dry Carbon Rear Diffuser with F1 Brake Light',
    slug: 'audi-a4-b9-dry-carbon-rear-diffuser',
    description:
      'Autoclave cured 2x2 dry carbon fiber rear diffuser with integrated F1 center rain/brake LED strobe light.',
    longDescription:
      'Engineered exclusively for the Audi A4 (B9 generation 2016-2023). Crafted with aerospace-grade Toray T700 carbon fiber and finished with an ultra-gloss UV clear coat. Direct replacement using factory bumper clip points.',
    price: 549,
    compareAtPrice: 620,
    category: 'carbon-fiber-styling',
    categoryName: 'Carbon Fiber Styling',
    images: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'single',
      vehicleId: 'audi-a4',
      vehicleIds: ['audi-a4'],
      compatibleMakes: ['Audi'],
      vehiclesDisplay: [
        {
          vehicleId: 'audi-a4',
          make: 'Audi',
          model: 'A4',
          generation: 'B9',
          yearStart: 2016,
          yearEnd: 2023,
          notes: 'Pre-facelift & Facelift S-Line Bumpers',
        },
      ],
    },
    specifications: [
      { label: 'Material', value: 'Toray T700 Dry Carbon Fiber' },
      { label: 'Weave', value: '2x2 Twill High Gloss' },
      { label: 'Fitment Type', value: 'Direct OEM Replacement' },
      { label: 'Strobe Light', value: '12V Integrated LED with Harness' },
    ],
    rating: 4.9,
    reviewCount: 38,
    inStock: true,
    stockQuantity: 12,
    sku: 'KRV-CF-AU01',
    featured: true,
    tags: ['Audi', 'A4', 'Carbon Fiber', 'Diffuser'],
  },

  // 2. Multi fitment: Audi A4 & A6 Dynamic LED Matrix Mirror Indicators
  {
    id: 'prod-audi-dynamic-indicators',
    title: 'Dynamic Sequential LED Side Mirror Turn Signal Indicators',
    slug: 'audi-dynamic-sequential-led-mirror-indicators',
    description:
      'Smoked lens sequential amber LED indicators with dynamic sweeping motion and blue welcome lock glow.',
    price: 119,
    compareAtPrice: 189,
    category: 'ambient-lighting',
    categoryName: 'Ambient Lighting',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'multi',
      vehicleIds: ['audi-a4', 'audi-a6'],
      compatibleMakes: ['Audi'],
      vehiclesDisplay: [
        {
          vehicleId: 'audi-a4',
          make: 'Audi',
          model: 'A4',
          generation: 'B9',
          yearStart: 2016,
          yearEnd: 2023,
        },
        {
          vehicleId: 'audi-a6',
          make: 'Audi',
          model: 'A6',
          generation: 'C8',
          yearStart: 2019,
          yearEnd: 2024,
        },
      ],
    },
    specifications: [
      { label: 'LED Technology', value: 'High-Density SMD Flowing LED' },
      { label: 'Lens Color', value: 'Smoked Gloss Polycarbonate' },
      { label: 'Installation', value: '100% Plug & Play (No Coding)' },
    ],
    rating: 4.8,
    reviewCount: 52,
    inStock: true,
    stockQuantity: 25,
    sku: 'KRV-LGT-AU02',
    featured: true,
    tags: ['Audi', 'A4', 'A6', 'LED', 'Turn Signals'],
  },

  // 3. Single fitment: Audi Q7 DSP Subwoofer
  {
    id: 'prod-audi-q7-subwoofer',
    title: 'Audi Q7 Spare-Wheel Well 10" Sealed Powered Subwoofer with DSP',
    slug: 'audi-q7-spare-wheel-well-10-dsp-subwoofer',
    description:
      'Concealed spare-wheel compartment 600W Class-D amplified subwoofer delivering resonant low-frequency punch.',
    price: 480,
    category: 'audio-speakers',
    categoryName: 'Audio & Speakers',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'single',
      vehicleId: 'audi-q7',
      vehicleIds: ['audi-q7'],
      compatibleMakes: ['Audi'],
      vehiclesDisplay: [
        {
          vehicleId: 'audi-q7',
          make: 'Audi',
          model: 'Q7',
          generation: '4M',
          yearStart: 2016,
          yearEnd: 2024,
        },
      ],
    },
    specifications: [
      { label: 'Peak Power', value: '600W Class-D Digital Amp' },
      { label: 'Frequency Range', value: '25Hz - 180Hz' },
      { label: 'Enclosure', value: 'Die-cast Acoustic Aluminum' },
    ],
    rating: 4.9,
    reviewCount: 19,
    inStock: true,
    stockQuantity: 8,
    sku: 'KRV-AUD-AU03',
    featured: false,
    tags: ['Audi', 'Q7', 'Subwoofer', 'DSP', 'Audio'],
  },

  // 4. Single fitment: Mercedes C-Class Panamericana Grille
  {
    id: 'prod-mb-c-class-grille',
    title: 'Mercedes C-Class W205 GT Panamericana Chrome Vertical Grille',
    slug: 'mercedes-c-class-w205-gt-panamericana-grille',
    description:
      'Aggressive GT Panamericana chrome vertical fin radiator grille engineered for Mercedes-Benz C-Class W205.',
    price: 219,
    compareAtPrice: 349,
    category: 'carbon-fiber-styling',
    categoryName: 'Carbon Fiber Styling',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'single',
      vehicleId: 'mercedes-c-class',
      vehicleIds: ['mercedes-c-class'],
      compatibleMakes: ['Mercedes-Benz'],
      vehiclesDisplay: [
        {
          vehicleId: 'mercedes-c-class',
          make: 'Mercedes-Benz',
          model: 'C-Class',
          generation: 'W205',
          yearStart: 2015,
          yearEnd: 2021,
        },
      ],
    },
    specifications: [
      { label: 'Finish', value: 'Mirror Chrome & Gloss Black Inlay' },
      { label: 'Distronic Compatible', value: 'Yes (Center Star Opening)' },
      { label: 'Material', value: 'High-Impact ABS' },
    ],
    rating: 4.8,
    reviewCount: 44,
    inStock: true,
    stockQuantity: 15,
    sku: 'KRV-EXT-MB01',
    featured: true,
    tags: ['Mercedes', 'C-Class', 'Grille', 'Panamericana'],
  },

  // 5. Multi fitment: Mercedes C-Class, E-Class, GLC 64-Color Rotary 3D Tweeters
  {
    id: 'prod-mb-rotary-tweeters',
    title: 'Burmester-Style 3D Motorized Rotary Front Tweeters with 64-Color LED',
    slug: 'mercedes-burmester-style-rotary-motorized-tweeters',
    description:
      'A-pillar motorized rotating tweeters that extend upon ignition and synchronize with ambient LED lighting.',
    price: 279,
    compareAtPrice: 429,
    category: 'audio-speakers',
    categoryName: 'Audio & Speakers',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'multi',
      vehicleIds: ['mercedes-c-class', 'mercedes-e-class', 'mercedes-glc'],
      compatibleMakes: ['Mercedes-Benz'],
      vehiclesDisplay: [
        {
          vehicleId: 'mercedes-c-class',
          make: 'Mercedes-Benz',
          model: 'C-Class',
          generation: 'W205',
          yearStart: 2015,
          yearEnd: 2021,
        },
        {
          vehicleId: 'mercedes-e-class',
          make: 'Mercedes-Benz',
          model: 'E-Class',
          generation: 'W213',
          yearStart: 2017,
          yearEnd: 2023,
        },
        {
          vehicleId: 'mercedes-glc',
          make: 'Mercedes-Benz',
          model: 'GLC',
          generation: 'X253',
          yearStart: 2016,
          yearEnd: 2022,
        },
      ],
    },
    specifications: [
      { label: 'Transducer', value: 'Silk Soft Dome Titanium Voice Coil' },
      { label: 'Lighting', value: 'Synchronized 64-Color Ambient LED' },
      { label: 'Mechanism', value: 'Silent Micro-Stepper Motor' },
    ],
    rating: 4.9,
    reviewCount: 67,
    inStock: true,
    stockQuantity: 18,
    sku: 'KRV-AUD-MB02',
    featured: true,
    tags: ['Mercedes', 'C-Class', 'E-Class', 'GLC', 'Tweeters', 'Burmester'],
  },

  // 6. Multi fitment: Mercedes C, E, GLC Turbine LED Air Vents
  {
    id: 'prod-mb-turbine-air-vents',
    title: 'Aviation Turbine Multi-Color LED Air Vents (Front & Rear Set)',
    slug: 'mercedes-aviation-turbine-led-air-vents-set',
    description:
      'Aerospace jet engine turbine vents with brushed electroplated louvers and dual-zone temperature reactive LEDs.',
    price: 249,
    compareAtPrice: 389,
    category: 'ambient-lighting',
    categoryName: 'Ambient Lighting',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'multi',
      vehicleIds: ['mercedes-c-class', 'mercedes-e-class', 'mercedes-glc'],
      compatibleMakes: ['Mercedes-Benz'],
      vehiclesDisplay: [
        {
          vehicleId: 'mercedes-c-class',
          make: 'Mercedes-Benz',
          model: 'C-Class',
          generation: 'W205',
          yearStart: 2015,
          yearEnd: 2021,
        },
        {
          vehicleId: 'mercedes-e-class',
          make: 'Mercedes-Benz',
          model: 'E-Class',
          generation: 'W213',
          yearStart: 2017,
          yearEnd: 2023,
        },
        {
          vehicleId: 'mercedes-glc',
          make: 'Mercedes-Benz',
          model: 'GLC',
          generation: 'X253',
          yearStart: 2016,
          yearEnd: 2022,
        },
      ],
    },
    specifications: [
      { label: 'Set Contents', value: '5 Front Dashboard Vents + 2 Rear Vents' },
      { label: 'Material', value: 'Anodized Billet Alloy Blades' },
      { label: 'Integration', value: 'OEM CANBUS Harness Match' },
    ],
    rating: 4.8,
    reviewCount: 39,
    inStock: true,
    stockQuantity: 14,
    sku: 'KRV-LGT-MB03',
    featured: false,
    tags: ['Mercedes', 'Air Vents', 'Turbine', 'Ambient Lighting'],
  },

  // 7. Single fitment: BMW 3 Series M-Performance Carbon Front Lip
  {
    id: 'prod-bmw-3-front-lip',
    title: 'BMW 3 Series G20 M-Sport 3-Piece Dry Carbon Front Lip Splitter',
    slug: 'bmw-3-series-g20-dry-carbon-front-lip-splitter',
    description:
      'High-downforce 3-piece dry carbon fiber front splitter engineered for BMW 3 Series G20 with M-Sport package.',
    price: 499,
    compareAtPrice: 560,
    category: 'carbon-fiber-styling',
    categoryName: 'Carbon Fiber Styling',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'single',
      vehicleId: 'bmw-3-series',
      vehicleIds: ['bmw-3-series'],
      compatibleMakes: ['BMW'],
      vehiclesDisplay: [
        {
          vehicleId: 'bmw-3-series',
          make: 'BMW',
          model: '3 Series',
          generation: 'G20',
          yearStart: 2019,
          yearEnd: 2024,
          notes: 'Fits M-Sport bumper only',
        },
      ],
    },
    specifications: [
      { label: 'Material', value: 'Pre-Preg Dry Carbon Fiber' },
      { label: 'Aerodynamic Lift', value: '-14% Front Axle Lift Reduction' },
      { label: 'Hardware', value: 'Stainless Screws & 3M VHB Tape' },
    ],
    rating: 4.9,
    reviewCount: 31,
    inStock: true,
    stockQuantity: 10,
    sku: 'KRV-CF-BM01',
    featured: true,
    tags: ['BMW', '3 Series', 'G20', 'Carbon Fiber', 'Front Lip'],
  },

  // 8. Multi fitment: BMW 3 Series & 5 Series Carbon Mirror Caps
  {
    id: 'prod-bmw-carbon-mirror-caps',
    title: 'BMW M-Style Aerodynamic Wing Horn Dry Carbon Mirror Housings',
    slug: 'bmw-m-style-dry-carbon-wing-mirror-housings',
    description:
      'Full replacement carbon mirror caps with signature M aerodynamic upper wing horn styling.',
    price: 159,
    compareAtPrice: 249,
    category: 'carbon-fiber-styling',
    categoryName: 'Carbon Fiber Styling',
    images: [
      'https://images.unsplash.com/photo-1555353540-64580b51c258?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1555353540-64580b51c258?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'multi',
      vehicleIds: ['bmw-3-series', 'bmw-5-series'],
      compatibleMakes: ['BMW'],
      vehiclesDisplay: [
        {
          vehicleId: 'bmw-3-series',
          make: 'BMW',
          model: '3 Series',
          generation: 'G20',
          yearStart: 2019,
          yearEnd: 2024,
        },
        {
          vehicleId: 'bmw-5-series',
          make: 'BMW',
          model: '5 Series',
          generation: 'G30',
          yearStart: 2017,
          yearEnd: 2023,
        },
      ],
    },
    specifications: [
      { label: 'Material', value: '100% Pre-Preg Carbon + ABS Internal Clips' },
      { label: 'Mounting', value: 'Direct Clip-in Factory Housing' },
      { label: 'Coating', value: 'Automotive Clear UV High Gloss' },
    ],
    rating: 4.8,
    reviewCount: 46,
    inStock: true,
    stockQuantity: 20,
    sku: 'KRV-CF-BM02',
    featured: false,
    tags: ['BMW', '3 Series', '5 Series', 'Carbon Mirror Caps'],
  },

  // 9. Multi fitment: BMW 3 Series, 5 Series, X3, X5 Crystal Gear Shift & iDrive Set
  {
    id: 'prod-bmw-crystal-controls',
    title: 'Illuminated Faceted Crystal Gear Selector, Start Button & Touch Knob Set',
    slug: 'bmw-faceted-crystal-gear-selector-set',
    description:
      'Opulent 3-piece K9 optical faceted crystal upgrade with backlit illuminated M emblem.',
    price: 299,
    compareAtPrice: 350,
    category: 'interior-accessories',
    categoryName: 'Interior Accessories',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'multi',
      vehicleIds: ['bmw-3-series', 'bmw-5-series', 'bmw-x3', 'bmw-x5'],
      compatibleMakes: ['BMW'],
      vehiclesDisplay: [
        {
          vehicleId: 'bmw-3-series',
          make: 'BMW',
          model: '3 Series',
          generation: 'G20',
          yearStart: 2019,
          yearEnd: 2024,
        },
        {
          vehicleId: 'bmw-5-series',
          make: 'BMW',
          model: '5 Series',
          generation: 'G30',
          yearStart: 2017,
          yearEnd: 2023,
        },
        {
          vehicleId: 'bmw-x3',
          make: 'BMW',
          model: 'X3',
          generation: 'G01',
          yearStart: 2018,
          yearEnd: 2024,
        },
        {
          vehicleId: 'bmw-x5',
          make: 'BMW',
          model: 'X5',
          generation: 'G05',
          yearStart: 2019,
          yearEnd: 2024,
        },
      ],
    },
    specifications: [
      { label: 'Crystal Quality', value: 'K9 Lead-Free Precision Polished Crystal' },
      { label: 'Backlight', value: 'Synchronized OEM Console Illumination' },
      { label: 'Items Included', value: 'Shifter + Start Engine + iDrive Ring' },
    ],
    rating: 4.9,
    reviewCount: 74,
    inStock: true,
    stockQuantity: 16,
    sku: 'KRV-INT-BM03',
    featured: true,
    tags: ['BMW', 'Crystal', 'Gear Shifter', 'Interior'],
  },

  // 10. Single fitment: BMW 3 Series Valvetronic Catback Exhaust
  {
    id: 'prod-bmw-3-valvetronic-exhaust',
    title: 'BMW 330i G20 Stainless Valvetronic Cat-Back Exhaust System',
    slug: 'bmw-330i-g20-valvetronic-catback-exhaust',
    description:
      'Mandrel-bent T304 stainless steel performance exhaust with dual electric solenoid valves and wireless remote control.',
    price: 1150,
    compareAtPrice: 1290,
    category: 'performance-exhausts',
    categoryName: 'Performance Exhausts',
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'single',
      vehicleId: 'bmw-3-series',
      vehicleIds: ['bmw-3-series'],
      compatibleMakes: ['BMW'],
      vehiclesDisplay: [
        {
          vehicleId: 'bmw-3-series',
          make: 'BMW',
          model: '3 Series',
          generation: 'G20',
          yearStart: 2019,
          yearEnd: 2024,
          notes: 'Fits B48 2.0L Turbo engines',
        },
      ],
    },
    specifications: [
      { label: 'Material', value: 'T304 Aircraft Grade Stainless Steel' },
      { label: 'Piping', value: '76mm (3.0") Main Pipe with Dual 90mm Tips' },
      { label: 'Power Gain', value: '+14 HP / +18 Nm torque' },
    ],
    rating: 4.9,
    reviewCount: 22,
    inStock: true,
    stockQuantity: 6,
    sku: 'KRV-EXH-BM04',
    featured: false,
    tags: ['BMW', 'Exhaust', 'Valvetronic', 'Performance'],
  },

  // 11. Single fitment: Porsche 911 GT3-Style Swan-Neck Track Wing
  {
    id: 'prod-porsche-911-swan-wing',
    title: 'Porsche 911 (992) GT3-Style Swan-Neck Dry Carbon Aerodynamic Rear Wing',
    slug: 'porsche-911-992-gt3-style-swan-neck-carbon-wing',
    description:
      'Motorsport top-mount swan-neck dry carbon fiber rear wing with CNC 7075 billet uprights and adjustable angle of attack.',
    price: 1890,
    compareAtPrice: 2150,
    category: 'carbon-fiber-styling',
    categoryName: 'Carbon Fiber Styling',
    images: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'single',
      vehicleId: 'porsche-911',
      vehicleIds: ['porsche-911'],
      compatibleMakes: ['Porsche'],
      vehiclesDisplay: [
        {
          vehicleId: 'porsche-911',
          make: 'Porsche',
          model: '911',
          generation: '992',
          yearStart: 2019,
          yearEnd: 2024,
        },
      ],
    },
    specifications: [
      { label: 'Material', value: 'High-Modulus Toray Carbon + Billet Uprights' },
      { label: 'Downforce', value: '140 kg @ 200 km/h in aggressive angle' },
      { label: 'Weight', value: '4.2 kg complete assembly' },
    ],
    rating: 5.0,
    reviewCount: 18,
    inStock: true,
    stockQuantity: 4,
    sku: 'KRV-CF-PO01',
    featured: true,
    tags: ['Porsche', '911', '992', 'Wing', 'Carbon Fiber'],
  },

  // 12. Single fitment: Porsche Panamera Titanium Valvetronic Catback Exhaust
  {
    id: 'prod-porsche-panamera-exhaust',
    title: 'Porsche Panamera (971) Grade 5 Titanium Valvetronic Cat-Back Exhaust',
    slug: 'porsche-panamera-titanium-valvetronic-catback-exhaust',
    description:
      'Lightweight Grade 5 aerospace titanium exhaust shaving 17 kg over OEM system with quad burnt-blue titanium tips.',
    price: 2450,
    category: 'performance-exhausts',
    categoryName: 'Performance Exhausts',
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'single',
      vehicleId: 'porsche-panamera',
      vehicleIds: ['porsche-panamera'],
      compatibleMakes: ['Porsche'],
      vehiclesDisplay: [
        {
          vehicleId: 'porsche-panamera',
          make: 'Porsche',
          model: 'Panamera',
          generation: '971',
          yearStart: 2017,
          yearEnd: 2023,
        },
      ],
    },
    specifications: [
      { label: 'Material', value: 'GR5 Aerospace Titanium Alloy' },
      { label: 'Weight Saving', value: '-17.2 kg vs factory exhaust' },
      { label: 'Tips', value: 'Quad 101mm Angle-Cut Burnt Blue Titanium' },
    ],
    rating: 4.9,
    reviewCount: 15,
    inStock: true,
    stockQuantity: 5,
    sku: 'KRV-EXH-PO02',
    featured: false,
    tags: ['Porsche', 'Panamera', 'Titanium', 'Exhaust'],
  },

  // 13. Multi fitment: Porsche Macan & Cayenne Carbon Mirror Covers
  {
    id: 'prod-porsche-macan-cayenne-mirrors',
    title: 'Porsche Macan & Cayenne Dry Carbon Fiber Wing Mirror Caps',
    slug: 'porsche-macan-cayenne-dry-carbon-mirror-caps',
    description:
      'Lightweight dry carbon mirror housings with exact OEM contour fitment for Porsche Macan & Cayenne.',
    price: 189,
    compareAtPrice: 289,
    category: 'carbon-fiber-styling',
    categoryName: 'Carbon Fiber Styling',
    images: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'multi',
      vehicleIds: ['porsche-macan', 'porsche-cayenne'],
      compatibleMakes: ['Porsche'],
      vehiclesDisplay: [
        {
          vehicleId: 'porsche-macan',
          make: 'Porsche',
          model: 'Macan',
          generation: '95B',
          yearStart: 2015,
          yearEnd: 2024,
        },
        {
          vehicleId: 'porsche-cayenne',
          make: 'Porsche',
          model: 'Cayenne',
          generation: '9YA',
          yearStart: 2018,
          yearEnd: 2024,
        },
      ],
    },
    specifications: [
      { label: 'Material', value: 'Pre-Preg Dry Carbon Fiber' },
      { label: 'Installation', value: 'Direct Clip-On Replacement' },
    ],
    rating: 4.8,
    reviewCount: 27,
    inStock: true,
    stockQuantity: 12,
    sku: 'KRV-CF-PO03',
    featured: false,
    tags: ['Porsche', 'Macan', 'Cayenne', 'Carbon', 'Mirrors'],
  },

  // 14. Universal: Wireless MagSafe Qi2 15W Carbon Vent & Dash Charger
  {
    id: 'prod-univ-magsafe-charger',
    title: 'Kravion Carbon MagSafe Qi2 15W Fast-Charging Active Cooling Mount',
    slug: 'kravion-carbon-magsafe-qi2-wireless-charging-mount',
    description:
      'CNC aviation aluminum & real carbon phone mount with N52 magnets and active semiconductor cooling.',
    price: 49,
    compareAtPrice: 79,
    category: 'interior-accessories',
    categoryName: 'Interior Accessories',
    images: [
      'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'universal',
      vehicleIds: [],
      compatibleMakes: ['Universal'],
      universalNotes:
        'Engineered for universal fitment across all automotive horizontal, vertical, and circular air vents, with optional 3M dash ball mount included.',
    },
    specifications: [
      { label: 'Charging Standard', value: 'Qi2 Certified 15W Fast Wireless' },
      { label: 'Magnets', value: '16x N52 Neodymium Magnetic Array' },
      { label: 'Cooling', value: 'Peltier Semiconductor Heat Sink' },
    ],
    rating: 4.8,
    reviewCount: 162,
    inStock: true,
    stockQuantity: 80,
    sku: 'KRV-ACC-UN01',
    featured: true,
    tags: ['Universal', 'Wireless Charger', 'MagSafe', 'Interior'],
  },

  // 15. Universal: ApexVision 4K UHD Front & Rear Dual Radar Dashcam
  {
    id: 'prod-univ-4k-dashcam',
    title: 'ApexVision 4K UHD Dual Stealth Dashcam with 24H Radar Parking Sentry',
    slug: 'apexvision-4k-dual-dashcam-24h-radar-sentry',
    description:
      'Discreet OEM-appearance 4K front and 2K rear Sony STARVIS 2 camera with 24H micro-wave radar sentry.',
    price: 229,
    compareAtPrice: 279,
    category: 'interior-accessories',
    categoryName: 'Interior Accessories',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'universal',
      vehicleIds: [],
      compatibleMakes: ['Universal'],
      universalNotes:
        'Universal compatibility for all 12V and 24V vehicles. Connects via fuse tap harness or 12V auxiliary port.',
    },
    specifications: [
      { label: 'Sensor', value: 'Sony STARVIS 2 IMX678 (4K) + IMX335 (2K)' },
      { label: 'Surveillance', value: '24-Hour Microwave Motion Radar' },
      { label: 'Connectivity', value: '5GHz High-Speed Wi-Fi App Transfer' },
    ],
    rating: 4.9,
    reviewCount: 94,
    inStock: true,
    stockQuantity: 35,
    sku: 'KRV-ACC-UN02',
    featured: true,
    tags: ['Universal', 'Dashcam', '4K', 'Radar', 'Sentry'],
  },

  // 16. Universal: 64-Color Symphony Fiber Optic Ambient Interior Kit
  {
    id: 'prod-univ-ambient-lighting-kit',
    title: 'AeroGlow 64-Color Symphony Micro-Fiber Dynamic Ambient Interior Lighting Kit',
    slug: 'aeroglow-64-color-symphony-universal-ambient-interior-kit',
    description:
      'Ultra-thin 1mm fiber optic light piping delivering uniform, non-glare interior ambient mood lighting across dashboard and 4 doors.',
    price: 139,
    compareAtPrice: 219,
    category: 'ambient-lighting',
    categoryName: 'Ambient Lighting',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
    ],
    featuredImage:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
    compatibility: {
      type: 'universal',
      vehicleIds: [],
      compatibleMakes: ['Universal'],
      universalNotes:
        'Universal 12V architecture fitting seamlessly into door panels and dashboard creases of any luxury automobile.',
    },
    specifications: [
      { label: 'LED Fiber', value: '1.0mm Side-Glow High Transmission Optical Acrylic' },
      { label: 'Control', value: 'Bluetooth iOS/Android App + Wireless RF Remote' },
      { label: 'Modes', value: '64 Solid Colors + 210 Dynamic Chasing Effects' },
    ],
    rating: 4.8,
    reviewCount: 118,
    inStock: true,
    stockQuantity: 45,
    sku: 'KRV-LGT-UN03',
    featured: true,
    tags: ['Universal', 'Ambient Lighting', 'LED', 'Symphony'],
  },
];

export const initialPosters: CarouselPoster[] = [
  {
    id: 'poster-ambient-cockpit',
    title: 'Elevate Your Cockpit',
    subtitle:
      'Bespoke 64-Color Dynamic Ambient Lighting & Faceted Crystal Controls for Audi, Mercedes & BMW',
    imageUrl:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1920&auto=format&fit=crop',
    buttonText: 'Explore Ambient Lighting',
    linkUrl: '/products?category=ambient-lighting',
    displayOrder: 1,
    active: true,
    targetDevice: 'desktop',
  },
  {
    id: 'poster-carbon-aerokits',
    title: 'Pure Aerodynamic Precision',
    subtitle:
      'Autoclave Toray Dry Carbon Diffusers, Splitters & Swan-Neck Wings Tailored for Track & Autobahn',
    imageUrl:
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1920&auto=format&fit=crop',
    buttonText: 'Shop Carbon Fiber',
    linkUrl: '/products?category=carbon-fiber-styling',
    displayOrder: 2,
    active: true,
    targetDevice: 'desktop',
  },
  {
    id: 'poster-audio-clarity',
    title: 'Acoustic Perfection',
    subtitle:
      'Motorized 3D Tweeters & Concealed Spare-Wheel DSP Subwoofers for Audiophiles',
    imageUrl:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1920&auto=format&fit=crop',
    buttonText: 'Upgrade Sound Stage',
    linkUrl: '/products?category=audio-speakers',
    displayOrder: 3,
    active: true,
    targetDevice: 'desktop',
  },
  {
    id: 'poster-valvetronic-exhaust',
    title: 'Exhilarating Acoustic Symphony',
    subtitle:
      'Valvetronic Titanium & Stainless Steel Exhaust Systems with Wireless Dual Solenoid Control',
    imageUrl:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1920&auto=format&fit=crop',
    buttonText: 'Hear The Roar',
    linkUrl: '/products?category=performance-exhausts',
    displayOrder: 4,
    active: true,
    targetDevice: 'desktop',
  },
  {
    id: 'poster-mobile-cockpit',
    title: 'Elevate Your Cockpit (Mobile)',
    subtitle: 'Bespoke Ambient Lighting & Faceted Controls',
    imageUrl:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1080&auto=format&fit=crop',
    buttonText: 'Explore Collection',
    linkUrl: '/products?category=ambient-lighting',
    displayOrder: 1,
    active: true,
    targetDevice: 'mobile',
  },
  {
    id: 'poster-mobile-aerokits',
    title: 'Pure Aerodynamic Precision (Mobile)',
    subtitle: 'Autoclave Toray Dry Carbon Diffusers & Splitters',
    imageUrl:
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1080&auto=format&fit=crop',
    buttonText: 'Shop Carbon Fiber',
    linkUrl: '/products?category=carbon-fiber-styling',
    displayOrder: 2,
    active: true,
    targetDevice: 'mobile',
  },
];

export const initialSettings: StoreSettings = {
  storeName: 'Kravion Auto',
  contactPhone: '+1234567890',
  whatsappRecipientNumber: '+1234567890',
  supportEmail: 'support@kravionauto.com',
  currency: 'INR',
  currencySymbol: '₹',
  freeShippingThreshold: 15000,
  announcementText:
    'Complimentary Worldwide Air Express Shipping on orders over ₹15,000 | 2-Year Precision Fitment Guarantee',
};
