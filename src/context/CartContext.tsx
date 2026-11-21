'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sanitizeFirestoreData } from '@/lib/data-service';

export const CART_STORAGE_KEY = 'kravion_cart';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  totalCount: number;
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  totalAmount: number;
  isHydrated: boolean;
  freeShippingThreshold: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 150.0;
const STANDARD_SHIPPING_COST = 25.0;
const TAX_RATE = 0.08; // 8%

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const syncLockRef = useRef(false);

  // SSR-safe hydration from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to hydrate cart from localStorage:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persistToStorageAndCloud = useCallback(
    async (newItems: CartItem[], currentUid?: string | null) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
        }
      } catch (err) {
        console.warn('Failed to save cart to localStorage:', err);
      }

      const uid = currentUid || user?.uid;
      if (uid && !syncLockRef.current) {
        try {
          const docRef = doc(db, 'user_carts', uid);
          const serializedItems = newItems.map((item) => ({
            productId: item.product.id,
            title: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            product: item.product,
          }));
          await setDoc(
            docRef,
            sanitizeFirestoreData({
              userId: uid,
              items: serializedItems,
              updatedAt: new Date().toISOString(),
            }),
            { merge: true }
          );
        } catch (err) {
          console.warn('Firestore cart sync blocked (session fallback active):', err);
        }
      }
    },
    [user?.uid]
  );

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Synchronize on authentication state change
  useEffect(() => {
    if (!user?.uid || !isHydrated) return;

    let active = true;
    const syncUserCart = async () => {
      try {
        syncLockRef.current = true;
        const docRef = doc(db, 'user_carts', user.uid);
        const snap = await getDoc(docRef);

        const currentLocalItems = itemsRef.current;

        if (snap.exists() && active) {
          const cloudData = snap.data();
          const cloudItems: any[] = Array.isArray(cloudData?.items) ? cloudData.items : [];

          // Merge local items with cloud items
          const mergedMap = new Map<string, CartItem>();

          // First add cloud items
          for (const cItem of cloudItems) {
            const prod = cItem.product || {
              id: cItem.productId,
              title: cItem.title,
              price: cItem.price,
            };
            mergedMap.set(prod.id, {
              product: prod,
              quantity: cItem.quantity || 1,
            });
          }

          // Then merge current local items
          for (const lItem of currentLocalItems) {
            if (mergedMap.has(lItem.product.id)) {
              const existing = mergedMap.get(lItem.product.id)!;
              existing.quantity += lItem.quantity;
            } else {
              mergedMap.set(lItem.product.id, { ...lItem });
            }
          }

          const mergedList = Array.from(mergedMap.values());
          setItems(mergedList);
          persistToStorageAndCloud(mergedList, user.uid);
        } else if (currentLocalItems.length > 0 && active) {
          // Upload local cart to cloud if cloud is empty
          persistToStorageAndCloud(currentLocalItems, user.uid);
        }
      } catch (err) {
        console.warn('Could not sync cart with cloud:', err);
      } finally {
        syncLockRef.current = false;
      }
    };

    syncUserCart();

    return () => {
      active = false;
    };
  }, [user?.uid, isHydrated, persistToStorageAndCloud]);

  const addItem = useCallback(
    (product: Product, quantity: number = 1) => {
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => item.product.id === product.id
        );
        let updated: CartItem[];
        if (existingIndex > -1) {
          updated = [...prevItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
        } else {
          updated = [...prevItems, { product, quantity }];
        }
        persistToStorageAndCloud(updated);
        return updated;
      });
    },
    [persistToStorageAndCloud]
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prevItems) => {
        const updated = prevItems.filter((item) => item.product.id !== productId);
        persistToStorageAndCloud(updated);
        return updated;
      });
    },
    [persistToStorageAndCloud]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setItems((prevItems) => {
        const updated = prevItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
        persistToStorageAndCloud(updated);
        return updated;
      });
    },
    [removeItem, persistToStorageAndCloud]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    persistToStorageAndCloud([]);
  }, [persistToStorageAndCloud]);

  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );
  const subtotal = Math.round(rawSubtotal * 100) / 100;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCount = itemCount;

  const shipping =
    items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_COST;

  const tax = items.length === 0 ? 0 : Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + shipping + tax) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        itemCount,
        subtotal,
        shipping,
        tax,
        totalAmount,
        isHydrated,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
