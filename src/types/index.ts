export type CompatibilityType = 'universal' | 'single' | 'multi';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  generation?: string;
  yearStart: number;
  yearEnd: number | null;
  yearRange?: string;
  bodyStyles?: string[];
  imageUrl?: string;
}

export interface ProductCompatibility {
  type: CompatibilityType;
  vehicleId?: string; // For single fitment
  vehicleIds?: string[]; // For single or multi fitment
  compatibleMakes?: string[]; // e.g. ["Audi"], ["BMW"], ["Universal"]
  universalNotes?: string; // Descriptive fitment note
  vehiclesDisplay?: Array<{
    vehicleId: string;
    make: string;
    model: string;
    generation?: string;
    yearStart: number;
    yearEnd: number | null;
    notes?: string;
  }>;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  categoryName: string;
  images: string[];
  featuredImage: string;
  compatibility: ProductCompatibility;
  specifications?: ProductSpecification[];
  specs?: Record<string, string>;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity: number;
  sku: string;
  featured: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  featured?: boolean;
  productCount?: number;
}

export interface CarouselPoster {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  linkUrl: string;
  displayOrder: number;
  active: boolean;
  tag?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
  compatibilityNote?: string;
}

export interface OrderEnquiry {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    notes?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: 'enquiry_placed' | 'contacted' | 'confirmed' | 'cancelled';
  customerNotes?: string;
  whatsappUrl: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: 'customer' | 'admin';
  shippingAddress?: ShippingAddress;
  savedVehicles?: Array<{
    make: string;
    model: string;
    year: number;
    vinOrNotes?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  contactPhone: string;
  whatsappRecipientNumber: string;
  supportEmail: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold?: number;
  announcementText?: string;
}

export interface ProductFilter {
  category?: string;
  make?: string;
  model?: string;
  year?: number;
  compatibilityType?: CompatibilityType;
  search?: string;
  featuredOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateOrderDTO {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    notes?: string;
  };
  items: OrderItem[];
  customerNotes?: string;
}
