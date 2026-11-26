import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  initialProducts,
  initialCategories,
  initialVehicles,
  initialPosters,
  initialSettings,
} from '@/lib/seed-data';
import { checkCompatibility } from '@/lib/compatibility';
import { generateWhatsAppOrderUrl, formatWhatsAppOrderUrl } from '@/lib/whatsapp';
import {
  Product,
  Category,
  Vehicle,
  CarouselPoster,
  OrderEnquiry,
  CreateOrderDTO,
  ProductFilter,
  StoreSettings,
  MarqueConfig,
} from '@/types';

export const DEFAULT_MARQUE_CONFIGS: Record<string, MarqueConfig> = {
  Audi: {
    make: 'Audi',
    featuredOnHome: true,
    tagline: 'Vorsprung durch Technik Aero & Dynamic Matrix Upgrades',
    modelsDescription: 'A4 B9, A6 C8, Q5 FY, Q7 4M',
    imageUrl:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop',
    logoText: 'AUDI',
    displayOrder: 1,
  },
  'Mercedes-Benz': {
    make: 'Mercedes-Benz',
    featuredOnHome: true,
    tagline: 'The Best or Nothing Bespoke Cabin & Rotary Soundstages',
    modelsDescription: 'C-Class W205, E-Class W213, GLC X253, GLE V167',
    imageUrl:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    logoText: 'MERCEDES',
    displayOrder: 2,
  },
  BMW: {
    make: 'BMW',
    featuredOnHome: true,
    tagline: 'The Ultimate Driving Machine Autoclave Carbon Fiber Aerodynamics',
    modelsDescription: '3 Series G20, 5 Series G30, X3 G01, X5 G05',
    imageUrl:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800&auto=format&fit=crop',
    logoText: 'BMW //M',
    displayOrder: 3,
  },
  Porsche: {
    make: 'Porsche',
    featuredOnHome: true,
    tagline: 'There is No Substitute Precision Valvetronic Titanium Performance',
    modelsDescription: '911 992, Panamera 971, Macan 95B, Cayenne 9YA',
    imageUrl:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=800&auto=format&fit=crop',
    logoText: 'PORSCHE',
    displayOrder: 4,
  },
};

// In-Memory Fallback State (deep cloned so modifications don't mutate defaults)
let inMemoryProducts: Product[] = JSON.parse(JSON.stringify(initialProducts));
let inMemoryCategories: Category[] = JSON.parse(JSON.stringify(initialCategories));
let inMemoryVehicles: Vehicle[] = JSON.parse(JSON.stringify(initialVehicles));
let inMemoryPosters: CarouselPoster[] = JSON.parse(JSON.stringify(initialPosters));
let inMemoryOrders: OrderEnquiry[] = [];
let inMemorySettings: StoreSettings = { ...initialSettings };
let inMemoryMarqueConfigs: Record<string, MarqueConfig> = JSON.parse(JSON.stringify(DEFAULT_MARQUE_CONFIGS));

export function resetInMemoryStore() {
  inMemoryProducts = JSON.parse(JSON.stringify(initialProducts));
  inMemoryCategories = JSON.parse(JSON.stringify(initialCategories));
  inMemoryVehicles = JSON.parse(JSON.stringify(initialVehicles));
  inMemoryPosters = JSON.parse(JSON.stringify(initialPosters));
  inMemoryOrders = [];
  inMemorySettings = { ...initialSettings };
  inMemoryMarqueConfigs = JSON.parse(JSON.stringify(DEFAULT_MARQUE_CONFIGS));
}

/**
 * Recursively sanitizes objects and arrays for Firestore operations by removing
 * keys with undefined values, which causes Firestore setDoc/addDoc to throw
 * "Unsupported field value: undefined".
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeFirestoreData(value);
    }
  }
  return sanitized as T;
}

/**
 * Resilient fetch of products with optional filtering
 */
export async function getProducts(filter?: ProductFilter): Promise<Product[]> {
  let products: Product[] = [];

  try {
    const colRef = collection(db, 'products');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      products = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Product)
      );
    } else {
      products = [...inMemoryProducts];
    }
  } catch (error) {
    // Transparent fallback to in-memory seed catalog
    products = [...inMemoryProducts];
  }

  // Apply in-memory filtering
  if (filter) {
    if (filter.category) {
      products = products.filter(
        (p) =>
          p.category.toLowerCase() === filter.category?.toLowerCase() ||
          p.categoryName.toLowerCase() === filter.category?.toLowerCase()
      );
    }

    if (filter.featuredOnly) {
      products = products.filter((p) => p.featured);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filter.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filter.minPrice!);
    }

    if (filter.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filter.maxPrice!);
    }

    if (filter.make) {
      const filterMake = filter.make.trim();
      const filterModel = filter.model ? filter.model.trim() : '';

      // If a model is provided, attempt to resolve the exact vehicle from the known catalog
      const matchedVehicle = filterModel
        ? inMemoryVehicles.find(
            (v) =>
              v.make.toLowerCase() === filterMake.toLowerCase() &&
              v.model.toLowerCase() === filterModel.toLowerCase()
          )
        : undefined;

      const dummyVehicle: Vehicle = matchedVehicle || {
        id: filterModel
          ? `${filterMake.toLowerCase()}-${filterModel.toLowerCase().replace(/\s+/g, '-')}`
          : filterMake.toLowerCase(),
        make: filterMake,
        model: filterModel,
        yearStart: filter.year || 2020,
        yearEnd: filter.year || null,
      };

      products = products.filter((product) => {
        const res = checkCompatibility(product, dummyVehicle);
        return res.compatible;
      });
    }

    if (filter.compatibilityType) {
      products = products.filter(
        (p) => p.compatibility.type === filter.compatibilityType
      );
    }
  }

  return products;
}

/**
 * Resilient fetch of a single product by ID or slug
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
  } catch (error) {
    // Fallback to in-memory
  }

  const found = inMemoryProducts.find((p) => p.id === id || p.slug === id);
  return found || null;
}

/**
 * Resilient fetch of categories
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const colRef = collection(db, 'categories');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Category))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }
  } catch (error) {
    // Fallback to in-memory
  }

  return [...inMemoryCategories].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Resilient fetch of supported vehicles
 */
export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const colRef = collection(db, 'vehicles');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
    }
  } catch (error) {
    // Fallback to in-memory
  }

  return [...inMemoryVehicles];
}

/**
 * Resilient fetch of homepage hero posters
 */
export async function getPosters(): Promise<CarouselPoster[]> {
  try {
    const colRef = collection(db, 'posters');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as CarouselPoster))
        .filter((p) => p.active)
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }
  } catch (error) {
    // Fallback to in-memory
  }

  return inMemoryPosters
    .filter((p) => p.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Resilient creation of an Order Enquiry with WhatsApp Hand-off URL
 */
export async function createOrderEnquiry(
  orderDTO: CreateOrderDTO & {
    subtotal?: number;
    shipping?: number;
    tax?: number;
    totalAmount?: number;
    notes?: string;
    vehicleDetails?: any;
    orderNumber?: string;
  }
): Promise<{ id: string; whatsappUrl: string }> {
  const orderRef =
    orderDTO.orderNumber ||
    `KRAV-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderId = orderDTO.orderNumber || `order-${Date.now()}`;

  const subtotal =
    orderDTO.subtotal !== undefined
      ? orderDTO.subtotal
      : orderDTO.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );

  const shipping =
    orderDTO.shipping !== undefined
      ? orderDTO.shipping
      : subtotal >= (inMemorySettings.freeShippingThreshold || 150)
      ? 0
      : 25;

  const tax =
    orderDTO.tax !== undefined
      ? orderDTO.tax
      : Math.round(subtotal * 0.08 * 100) / 100;

  const totalAmount =
    orderDTO.totalAmount !== undefined
      ? orderDTO.totalAmount
      : Math.round((subtotal + shipping + tax) * 100) / 100;

  const enquiry: any = {
    id: orderId,
    orderNumber: orderRef,
    customerId: orderDTO.customerId,
    customerName: orderDTO.customerName,
    customerEmail: orderDTO.customerEmail,
    customerPhone: orderDTO.customerPhone,
    shippingAddress: orderDTO.shippingAddress,
    vehicleInfo: orderDTO.vehicleInfo,
    vehicleDetails: orderDTO.vehicleDetails || orderDTO.vehicleInfo,
    items: orderDTO.items.map((i) => ({
      ...i,
      price: i.unitPrice,
      subtotal: i.subtotal !== undefined ? i.subtotal : i.unitPrice * i.quantity,
    })),
    subtotal,
    shipping,
    tax,
    totalAmount,
    currency: inMemorySettings.currency || 'USD',
    status: 'enquiry_placed',
    paymentMethod: 'none',
    paymentStatus: 'pending_manual_quote',
    customerNotes: orderDTO.customerNotes || orderDTO.notes,
    notes: orderDTO.notes || orderDTO.customerNotes,
    whatsappUrl: '',
    createdAt: new Date().toISOString(),
  };

  // Fetch live store settings from Firestore / cache to guarantee admin's latest WhatsApp number is used
  let activeSettings = inMemorySettings;
  try {
    const liveSettings = await getStoreSettings();
    if (liveSettings) {
      activeSettings = { ...inMemorySettings, ...liveSettings };
      inMemorySettings = activeSettings;
    }
  } catch (settingsError) {
    console.warn('Could not fetch live settings for order enquiry, using in-memory settings:', settingsError);
  }

  const recipientPhone =
    activeSettings.whatsappRecipientNumber ||
    (activeSettings as any).whatsappNumber ||
    inMemorySettings.whatsappRecipientNumber ||
    (inMemorySettings as any).whatsappNumber ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    '919876543210';

  enquiry.currency = activeSettings.currency || inMemorySettings.currency || 'INR';
  enquiry.whatsappUrl = formatWhatsAppOrderUrl(enquiry, recipientPhone);

  // Commit to in-memory state first
  inMemoryOrders.unshift(enquiry as OrderEnquiry);

  // Attempt Firestore write
  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, sanitizeFirestoreData(enquiry));
  } catch (error) {
    console.warn(
      'Firestore order write blocked (using resilient session fallback):',
      error
    );
  }

  return {
    id: enquiry.id,
    whatsappUrl: enquiry.whatsappUrl,
  };
}

/**
 * Resilient fetch of order enquiries
 */
export async function getOrders(): Promise<OrderEnquiry[]> {
  try {
    const colRef = collection(db, 'orders');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as OrderEnquiry)
      );
    }
  } catch (error) {
    // Fallback to in-memory
  }

  return [...inMemoryOrders];
}

/**
 * Resilient fetch of order enquiries for a specific customer
 */
export async function getCustomerOrders(customerId: string): Promise<OrderEnquiry[]> {
  if (!customerId) return [];

  const orderMap = new Map<string, OrderEnquiry>();

  // 1. Fetch from Firestore
  try {
    const colRef = collection(db, 'orders');
    const q = query(colRef, where('customerId', '==', customerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() } as OrderEnquiry;
        orderMap.set(data.id, data);
      });
    }
  } catch (error) {
    // Fallback to in-memory and local cache
  }

  // 2. Merge in-memory orders
  inMemoryOrders
    .filter((o) => o.customerId === customerId)
    .forEach((o) => {
      if (!orderMap.has(o.id)) {
        orderMap.set(o.id, o);
      }
    });

  // 3. Merge browser cached orders if available
  if (typeof window !== 'undefined') {
    try {
      const key = `kravion_orders_${customerId}`;
      const local = JSON.parse(window.localStorage.getItem(key) || '[]');
      if (Array.isArray(local)) {
        local.forEach((o: OrderEnquiry) => {
          if (o && o.id && !orderMap.has(o.id)) {
            orderMap.set(o.id, o);
          }
        });
      }
      const recent = JSON.parse(window.localStorage.getItem('kravion_recent_order') || 'null');
      if (recent && recent.customerId === customerId && recent.id && !orderMap.has(recent.id)) {
        orderMap.set(recent.id, recent);
      }
    } catch (e) {
      // LocalStorage access fail-safe
    }
  }

  return Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

/**
 * Resilient creation or update of a product
 */
export async function saveProduct(product: Partial<Product>): Promise<string> {
  const id =
    product.id ||
    `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const slug =
    product.slug ||
    (product.title
      ? product.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      : id);

  const fullProduct: Product = {
    id,
    title: product.title || 'Untitled Product',
    slug,
    description: product.description || '',
    longDescription: product.longDescription || product.description || '',
    price: product.price ?? 0,
    compareAtPrice: product.compareAtPrice,
    category: product.category || 'ambient-lighting',
    categoryName: product.categoryName || 'Ambient Lighting',
    images: product.images || [],
    featuredImage:
      product.featuredImage ||
      (product.images && product.images[0]) ||
      'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp',
    compatibility: product.compatibility || {
      type: 'universal',
      vehicleIds: [],
    },
    specifications: product.specifications || (product.specs ? Object.entries(product.specs).map(([label, value]) => ({ label, value: String(value) })) : []),
    specs: product.specs || (product.specifications ? Object.fromEntries(product.specifications.map((s) => [s.label, s.value])) : {}),
    rating: product.rating ?? 5.0,
    reviewCount: product.reviewCount ?? 0,
    inStock: product.inStock ?? true,
    stockQuantity: product.stockQuantity ?? 10,
    sku: product.sku || `KRV-${Date.now().toString(36).toUpperCase()}`,
    featured: product.featured ?? false,
    tags: product.tags || [],
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Update in-memory state
  const existingIdx = inMemoryProducts.findIndex((p) => p.id === id);
  if (existingIdx >= 0) {
    inMemoryProducts[existingIdx] = fullProduct;
  } else {
    inMemoryProducts.unshift(fullProduct);
  }

  // Attempt Firestore write
  try {
    const docRef = doc(db, 'products', id);
    await setDoc(docRef, sanitizeFirestoreData(fullProduct), { merge: true });
  } catch (error) {
    console.warn(
      'Firestore product save blocked (using resilient session fallback):',
      error
    );
  }

  return id;
}

/**
 * Resilient deletion of a product
 */
export async function deleteProduct(id: string): Promise<void> {
  inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id);

  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn(
      'Firestore product delete blocked (using resilient session fallback):',
      error
    );
  }
}

/**
 * Resilient fetch of store settings
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const docRef = doc(db, 'settings', 'store');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const liveData = snap.data() as StoreSettings;
      inMemorySettings = { ...inMemorySettings, ...liveData };
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('kravion_store_settings', JSON.stringify(inMemorySettings));
        } catch {}
      }
      return inMemorySettings;
    }
  } catch (error) {
    // Fallback to in-memory / localStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('kravion_store_settings');
        if (cached) {
          inMemorySettings = { ...inMemorySettings, ...JSON.parse(cached) };
          return inMemorySettings;
        }
      } catch {}
    }
  }

  return { ...inMemorySettings };
}

/**
 * Resilient update of store settings
 */
export async function updateStoreSettings(
  settings: Partial<StoreSettings>
): Promise<StoreSettings> {
  inMemorySettings = { ...inMemorySettings, ...settings };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('kravion_store_settings', JSON.stringify(inMemorySettings));
    } catch {}
  }

  try {
    const docRef = doc(db, 'settings', 'store');
    await setDoc(docRef, sanitizeFirestoreData(inMemorySettings), { merge: true });
  } catch (error) {
    console.warn(
      'Firestore settings write blocked (using resilient session fallback):',
      error
    );
  }

  return inMemorySettings;
}

/**
 * Resilient creation or update of a category
 */
export async function saveCategory(category: Partial<Category>): Promise<string> {
  const id =
    category.id ||
    category.slug ||
    (category.name
      ? category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : `cat-${Date.now()}`);
  const slug =
    category.slug ||
    (category.name
      ? category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : id);

  const fullCategory: Category = {
    id,
    name: category.name || 'Untitled Category',
    slug,
    description: category.description || '',
    imageUrl:
      category.imageUrl ||
      'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp',
    displayOrder: category.displayOrder ?? inMemoryCategories.length + 1,
    featured: category.featured ?? true,
    productCount: category.productCount ?? 0,
  };

  const existingIdx = inMemoryCategories.findIndex((c) => c.id === id);
  if (existingIdx >= 0) {
    inMemoryCategories[existingIdx] = fullCategory;
  } else {
    inMemoryCategories.push(fullCategory);
  }

  try {
    const docRef = doc(db, 'categories', id);
    await setDoc(docRef, sanitizeFirestoreData(fullCategory), { merge: true });
  } catch (error) {
    console.warn('Firestore category save blocked (using resilient session fallback):', error);
  }

  return id;
}

/**
 * Resilient deletion of a category
 */
export async function deleteCategory(id: string): Promise<void> {
  inMemoryCategories = inMemoryCategories.filter((c) => c.id !== id && c.slug !== id);

  try {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore category delete blocked (using resilient session fallback):', error);
  }
}

/**
 * Resilient creation or update of a vehicle
 */
export async function saveVehicle(vehicle: Partial<Vehicle>): Promise<string> {
  const id =
    vehicle.id ||
    `${(vehicle.make || 'vehicle').toLowerCase()}-${(vehicle.model || 'model')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`.replace(/(^-|-$)+/g, '');

  const startYear = vehicle.yearStart || 2020;
  const endYear = vehicle.yearEnd ?? null;
  const yearRange =
    vehicle.yearRange ||
    (endYear ? `${startYear} - ${endYear}` : `${startYear} - Present`);

  const fullVehicle: Vehicle = {
    id,
    make: vehicle.make || 'General',
    model: vehicle.model || 'Model',
    generation: vehicle.generation || '',
    yearStart: startYear,
    yearEnd: endYear,
    yearRange,
    bodyStyles: vehicle.bodyStyles || ['Sedan', 'Coupe'],
    imageUrl: vehicle.imageUrl || '',
  };

  const existingIdx = inMemoryVehicles.findIndex((v) => v.id === id);
  if (existingIdx >= 0) {
    inMemoryVehicles[existingIdx] = fullVehicle;
  } else {
    inMemoryVehicles.push(fullVehicle);
  }

  try {
    const docRef = doc(db, 'vehicles', id);
    await setDoc(docRef, sanitizeFirestoreData(fullVehicle), { merge: true });
  } catch (error) {
    console.warn('Firestore vehicle save blocked (using resilient session fallback):', error);
  }

  return id;
}

/**
 * Resilient deletion of a vehicle
 */
export async function deleteVehicle(id: string): Promise<void> {
  const vehToDelete = inMemoryVehicles.find((v) => v.id === id);
  const makeToCheck = vehToDelete?.make;

  inMemoryVehicles = inMemoryVehicles.filter((v) => v.id !== id);

  try {
    const docRef = doc(db, 'vehicles', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore vehicle delete blocked (using resilient session fallback):', error);
  }

  // If no remaining vehicles exist for this make, remove the marque config as well
  if (
    makeToCheck &&
    !inMemoryVehicles.some((v) => v.make.toLowerCase() === makeToCheck.toLowerCase())
  ) {
    await deleteMarqueConfig(makeToCheck);
  }
}

/**
 * Rename a vehicle manufacturer/make across all vehicles and product compatibility mappings
 */
export async function renameMake(oldMake: string, newMake: string): Promise<number> {
  const cleanOld = oldMake.trim();
  const cleanNew = newMake.trim();
  if (!cleanOld || !cleanNew || cleanOld === cleanNew) return 0;

  let count = 0;

  // 1. Update in-memory vehicles
  inMemoryVehicles = inMemoryVehicles.map((v) => {
    if (v.make.toLowerCase() === cleanOld.toLowerCase()) {
      count++;
      return { ...v, make: cleanNew };
    }
    return v;
  });

  // 1b. Update in-memory marque configs
  if (inMemoryMarqueConfigs[cleanOld]) {
    inMemoryMarqueConfigs[cleanNew] = {
      ...inMemoryMarqueConfigs[cleanOld],
      make: cleanNew,
      logoText: cleanNew.toUpperCase(),
    };
    delete inMemoryMarqueConfigs[cleanOld];
    saveAllMarqueConfigs(Object.values(inMemoryMarqueConfigs)).catch(() => {});
  }

  // 2. Update Firestore vehicles
  try {
    const colRef = collection(db, 'vehicles');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      for (const d of snap.docs) {
        const data = d.data() as Vehicle;
        if (data.make && data.make.toLowerCase() === cleanOld.toLowerCase()) {
          await setDoc(doc(db, 'vehicles', d.id), { make: cleanNew }, { merge: true });
        }
      }
    }
  } catch (err) {
    console.warn('Firestore bulk vehicle make update blocked (using resilient fallback):', err);
  }

  // 3. Also update product compatibility compatibleMakes
  inMemoryProducts = inMemoryProducts.map((p) => {
    if (p.compatibility?.compatibleMakes) {
      const updatedMakes = p.compatibility.compatibleMakes.map((m) =>
        m.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : m
      );
      return {
        ...p,
        compatibility: {
          ...p.compatibility,
          compatibleMakes: updatedMakes,
        },
      };
    }
    return p;
  });

  try {
    const prodCol = collection(db, 'products');
    const prodSnap = await getDocs(prodCol);
    if (!prodSnap.empty) {
      for (const d of prodSnap.docs) {
        const prod = d.data() as Product;
        if (prod.compatibility?.compatibleMakes) {
          const hasOld = prod.compatibility.compatibleMakes.some(
            (m) => m.toLowerCase() === cleanOld.toLowerCase()
          );
          if (hasOld) {
            const updatedMakes = prod.compatibility.compatibleMakes.map((m) =>
              m.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : m
            );
            await setDoc(
              doc(db, 'products', d.id),
              { compatibility: { ...prod.compatibility, compatibleMakes: updatedMakes } },
              { merge: true }
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn('Firestore product make rename fallback:', err);
  }

  return count;
}

/**
 * Delete a make and all vehicles registered under it
 */
export async function deleteMake(makeName: string): Promise<number> {
  const clean = makeName.trim();
  if (!clean) return 0;

  const toDelete = inMemoryVehicles.filter(
    (v) => v.make.toLowerCase() === clean.toLowerCase()
  );
  inMemoryVehicles = inMemoryVehicles.filter(
    (v) => v.make.toLowerCase() !== clean.toLowerCase()
  );

  for (const v of toDelete) {
    try {
      await deleteDoc(doc(db, 'vehicles', v.id));
    } catch (e) {
      // Ignore fallback
    }
  }

  await deleteMarqueConfig(clean);

  return toDelete.length;
}

/**
 * Add a new make by creating an initial vehicle entry
 */
export async function addMake(
  makeName: string,
  initialModel = 'Base Model',
  yearStart = 2020
): Promise<string> {
  const cleanMake = makeName.trim();
  const cleanModel = (initialModel || 'Base Model').trim();

  const id = `${cleanMake.toLowerCase()}-${cleanModel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/(^-|-$)+/g, '');

  const newVehicle: Vehicle = {
    id,
    make: cleanMake,
    model: cleanModel,
    generation: 'Gen 1',
    yearStart,
    yearEnd: null,
    yearRange: `${yearStart} - Present`,
    bodyStyles: ['Sedan', 'Coupe'],
    imageUrl: '',
  };

  await saveVehicle(newVehicle);
  return id;
}

/**
 * Delete a marque config by vehicle make
 */
export async function deleteMarqueConfig(makeName: string): Promise<void> {
  const clean = makeName.trim().toLowerCase();
  if (!clean) return;

  const updated: Record<string, MarqueConfig> = {};
  for (const [key, val] of Object.entries(inMemoryMarqueConfigs)) {
    if (key.toLowerCase() !== clean && val.make.toLowerCase() !== clean) {
      updated[val.make] = val;
    }
  }
  inMemoryMarqueConfigs = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kravion_marque_configs', JSON.stringify(inMemoryMarqueConfigs));
    } catch (e) {
      // Ignore
    }
  }

  try {
    const docRef = doc(db, 'settings', 'marques');
    await setDoc(docRef, { marques: inMemoryMarqueConfigs });
  } catch (error) {
    console.warn('Firestore marque deletion blocked (using resilient fallback):', error);
  }
}

/**
 * Resilient fetch of marque configurations for the storefront "Marque Selection" section
 */
export async function getMarqueConfigs(): Promise<MarqueConfig[]> {
  // 1. Try local storage in browser
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('kravion_marque_configs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          inMemoryMarqueConfigs = { ...inMemoryMarqueConfigs, ...parsed };
        }
      }
    } catch (e) {
      // Ignore localStorage parse error
    }
  }

  // 2. Try Firestore settings/marques document
  try {
    const docRef = doc(db, 'settings', 'marques');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.marques && typeof data.marques === 'object') {
        inMemoryMarqueConfigs = { ...inMemoryMarqueConfigs, ...data.marques };
      }
    }
  } catch (error) {
    // Resilient fallback to memory/localStorage
  }

  // 3. Ensure every active make in vehicles is present in marque configs, and prune orphan makes
  try {
    const vehicles = await getVehicles();
    const allMakes = Array.from(new Set(vehicles.map((v) => v.make.trim()))).sort();
    const activeMakeSet = new Set(allMakes.map((m) => m.toLowerCase()));

    // If vehicles exist in the database, prune any marque configs whose makes no longer exist
    if (vehicles.length > 0) {
      const pruned: Record<string, MarqueConfig> = {};
      let changed = false;
      for (const [key, config] of Object.entries(inMemoryMarqueConfigs)) {
        if (activeMakeSet.has(config.make.toLowerCase().trim())) {
          pruned[config.make] = config;
        } else {
          changed = true;
        }
      }
      if (changed) {
        inMemoryMarqueConfigs = pruned;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('kravion_marque_configs', JSON.stringify(inMemoryMarqueConfigs));
          } catch (e) {}
        }
        try {
          const docRef = doc(db, 'settings', 'marques');
          await setDoc(docRef, { marques: inMemoryMarqueConfigs });
        } catch (e) {}
      }
    }

    allMakes.forEach((make, idx) => {
      if (!inMemoryMarqueConfigs[make]) {
        const matchingVeh = vehicles.find((v) => v.make === make && v.imageUrl);
        inMemoryMarqueConfigs[make] = {
          make,
          featuredOnHome: true,
          imageUrl: matchingVeh?.imageUrl || '',
          tagline: 'Precision OEM+ Fitment',
          modelsDescription: `${vehicles.filter((v) => v.make === make).length} Models Available`,
          logoText: make.toUpperCase(),
          displayOrder: 10 + idx,
        };
      }
    });
  } catch (e) {
    // Ignore fallback
  }

  return Object.values(inMemoryMarqueConfigs).sort(
    (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99) || a.make.localeCompare(b.make)
  );
}

/**
 * Save or update a single marque configuration
 */
export async function saveMarqueConfig(config: MarqueConfig): Promise<void> {
  const cleanMake = config.make.trim();
  if (!cleanMake) return;

  inMemoryMarqueConfigs[cleanMake] = {
    ...config,
    make: cleanMake,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kravion_marque_configs', JSON.stringify(inMemoryMarqueConfigs));
    } catch (e) {
      // Ignore
    }
  }

  try {
    const docRef = doc(db, 'settings', 'marques');
    await setDoc(docRef, { marques: inMemoryMarqueConfigs });
  } catch (error) {
    console.warn('Firestore marque config update blocked (using resilient session fallback):', error);
  }
}

/**
 * Batch save/update all marque configurations
 */
export async function saveAllMarqueConfigs(configs: MarqueConfig[]): Promise<void> {
  const newMap: Record<string, MarqueConfig> = {};
  for (const c of configs) {
    if (c && c.make) {
      newMap[c.make.trim()] = { ...c, make: c.make.trim() };
    }
  }
  inMemoryMarqueConfigs = newMap;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kravion_marque_configs', JSON.stringify(inMemoryMarqueConfigs));
    } catch (e) {
      // Ignore
    }
  }

  try {
    const docRef = doc(db, 'settings', 'marques');
    await setDoc(docRef, { marques: inMemoryMarqueConfigs });
  } catch (error) {
    console.warn('Firestore batch marques save blocked (using resilient fallback):', error);
  }
}

/**
 * Resilient fetch of ALL posters (active and inactive) for admin management
 */
export async function getAllPosters(): Promise<CarouselPoster[]> {
  try {
    const colRef = collection(db, 'posters');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as CarouselPoster))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }
  } catch (error) {
    // Fallback to in-memory
  }

  return [...inMemoryPosters].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Resilient creation or update of a hero poster
 */
export async function savePoster(poster: Partial<CarouselPoster>): Promise<string> {
  const id = poster.id || `poster-${Date.now()}`;

  const fullPoster: CarouselPoster = {
    id,
    title: poster.title || 'Exclusive Collection',
    subtitle: poster.subtitle || 'Engineered for distinction',
    imageUrl:
      poster.imageUrl ||
      'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp',
    buttonText: poster.buttonText || 'Explore Now',
    linkUrl: poster.linkUrl || '/products',
    displayOrder: poster.displayOrder ?? inMemoryPosters.length + 1,
    active: poster.active ?? true,
    tag: poster.tag,
    targetDevice: poster.targetDevice || 'desktop',
  };

  const existingIdx = inMemoryPosters.findIndex((p) => p.id === id);
  if (existingIdx >= 0) {
    inMemoryPosters[existingIdx] = fullPoster;
  } else {
    inMemoryPosters.push(fullPoster);
  }

  try {
    const docRef = doc(db, 'posters', id);
    await setDoc(docRef, sanitizeFirestoreData(fullPoster), { merge: true });
  } catch (error) {
    console.warn('Firestore poster save blocked (using resilient session fallback):', error);
  }

  return id;
}

/**
 * Resilient deletion of a hero poster
 */
export async function deletePoster(id: string): Promise<void> {
  inMemoryPosters = inMemoryPosters.filter((p) => p.id !== id);

  try {
    const docRef = doc(db, 'posters', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore poster delete blocked (using resilient session fallback):', error);
  }
}

/**
 * Resilient order status transition
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderEnquiry['status']
): Promise<void> {
  const order = inMemoryOrders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
  }

  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, { status }, { merge: true });
  } catch (error) {
    console.warn('Firestore order status update blocked (using resilient session fallback):', error);
  }
}
