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
import { sanitizeFirestoreData, getProducts } from '@/lib/data-service';

export const WISHLIST_STORAGE_KEY = 'kravion_wishlist';

export interface WishlistContextType {
  items: Product[];
  count: number;
  isHydrated: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const syncLockRef = useRef(false);

  // SSR-safe hydration from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to hydrate wishlist from localStorage:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persistToStorageAndCloud = useCallback(
    async (newItems: Product[], currentUid?: string | null) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newItems));
        }
      } catch (err) {
        console.warn('Failed to save wishlist to localStorage:', err);
      }

      const uid = currentUid || user?.uid;
      if (uid && !syncLockRef.current) {
        try {
          const docRef = doc(db, 'user_wishlists', uid);
          const itemIds = newItems.map((p) => p.id);
          await setDoc(
            docRef,
            sanitizeFirestoreData({
              userId: uid,
              items: itemIds,
              products: newItems,
              updatedAt: new Date().toISOString(),
            }),
            { merge: true }
          );
        } catch (err) {
          console.warn('Firestore wishlist sync blocked (session fallback active):', err);
        }
      }
    },
    [user?.uid]
  );

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Synchronize with Firestore upon user authentication
  useEffect(() => {
    if (!user?.uid || !isHydrated) return;

    let active = true;
    const syncUserWishlist = async () => {
      try {
        syncLockRef.current = true;
        const docRef = doc(db, 'user_wishlists', user.uid);
        const snap = await getDoc(docRef);

        const currentLocalItems = itemsRef.current;

        if (snap.exists() && active) {
          const cloudData = snap.data();
          const cloudItemIds: string[] = Array.isArray(cloudData?.items)
            ? cloudData.items
            : [];
          const cloudProducts: Product[] = Array.isArray(cloudData?.products)
            ? cloudData.products
            : [];

          // Build a deduplicated map of products
          const productMap = new Map<string, Product>();

          // Existing local products
          for (const item of currentLocalItems) {
            productMap.set(item.id, item);
          }

          // Add cloud products if available
          for (const cp of cloudProducts) {
            if (!productMap.has(cp.id)) {
              productMap.set(cp.id, cp);
            }
          }

          // If there are IDs in cloud not yet in productMap, fetch them
          const missingIds = cloudItemIds.filter((id) => !productMap.has(id));
          if (missingIds.length > 0) {
            try {
              const allProducts = await getProducts();
              for (const id of missingIds) {
                const found = allProducts.find((p) => p.id === id);
                if (found) {
                  productMap.set(id, found);
                } else {
                  // Fallback stub if not found in catalog
                  productMap.set(id, {
                    id,
                    title: `Saved Item (${id})`,
                    price: 0,
                    category: 'accessories',
                    categoryName: 'Accessories',
                    images: [],
                    featuredImage: '/placeholder.png',
                    compatibility: { type: 'universal' },
                    rating: 5,
                    reviewCount: 0,
                    inStock: true,
                    stockQuantity: 10,
                    sku: id,
                    featured: false,
                    description: '',
                    slug: id,
                  });
                }
              }
            } catch {
              // Ignore fetch failure
            }
          }

          const mergedProducts = Array.from(productMap.values());
          setItems(mergedProducts);
          persistToStorageAndCloud(mergedProducts, user.uid);
        } else if (currentLocalItems.length > 0 && active) {
          // Cloud doc does not exist yet: write local items
          persistToStorageAndCloud(currentLocalItems, user.uid);
        }
      } catch (err) {
        console.warn('Could not sync wishlist with cloud:', err);
      } finally {
        syncLockRef.current = false;
      }
    };

    syncUserWishlist();

    return () => {
      active = false;
    };
  }, [user?.uid, isHydrated, persistToStorageAndCloud]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.id === productId);
    },
    [items]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      setItems((prevItems) => {
        const exists = prevItems.some((item) => item.id === product.id);
        let updated: Product[];
        if (exists) {
          updated = prevItems.filter((item) => item.id !== product.id);
        } else {
          updated = [...prevItems, product];
        }
        persistToStorageAndCloud(updated);
        return updated;
      });
    },
    [persistToStorageAndCloud]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setItems((prevItems) => {
        const updated = prevItems.filter((item) => item.id !== productId);
        persistToStorageAndCloud(updated);
        return updated;
      });
    },
    [persistToStorageAndCloud]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    persistToStorageAndCloud([]);
  }, [persistToStorageAndCloud]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        isHydrated,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
