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
} from '@/types';

// In-Memory Fallback State (deep cloned so modifications don't mutate defaults)
let inMemoryProducts: Product[] = JSON.parse(JSON.stringify(initialProducts));
let inMemoryCategories: Category[] = JSON.parse(JSON.stringify(initialCategories));
let inMemoryVehicles: Vehicle[] = JSON.parse(JSON.stringify(initialVehicles));
let inMemoryPosters: CarouselPoster[] = JSON.parse(JSON.stringify(initialPosters));
let inMemoryOrders: OrderEnquiry[] = [];
let inMemorySettings: StoreSettings = { ...initialSettings };

export function resetInMemoryStore() {
  inMemoryProducts = JSON.parse(JSON.stringify(initialProducts));
  inMemoryCategories = JSON.parse(JSON.stringify(initialCategories));
  inMemoryVehicles = JSON.parse(JSON.stringify(initialVehicles));
  inMemoryPosters = JSON.parse(JSON.stringify(initialPosters));
  inMemoryOrders = [];
  inMemorySettings = { ...initialSettings };
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

  const recipientPhone =
    inMemorySettings.whatsappRecipientNumber ||
    (inMemorySettings as any).whatsappNumber ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    '919876543210';

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
      return { ...inMemorySettings, ...snap.data() } as StoreSettings;
    }
  } catch (error) {
    // Fallback to in-memory
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
  inMemoryVehicles = inMemoryVehicles.filter((v) => v.id !== id);

  try {
    const docRef = doc(db, 'vehicles', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore vehicle delete blocked (using resilient session fallback):', error);
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
