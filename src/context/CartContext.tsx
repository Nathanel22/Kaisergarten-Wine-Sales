import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { isOrderableWine, restoreCatalogCart } from '../utils/catalog';
import { CATALOG } from '../data/catalog';
import { Wine } from '../types/wine';
import { CartItem, CartSummary } from '../types/cart';
import { Order } from '../types/order';
import { Seller, DEMO_SELLERS, DEFAULT_DEMO_SELLER } from '../config/demoSeller';
import { validateCartonRule, CartonValidationResult } from '../utils/cartonRule';
import { chfToRappen, rappenToCHF, roundRappen5 } from '../utils/formatters';

interface CartContextType {
  items: CartItem[];
  addItem: (wine: Wine, count?: number) => void;
  addCase: (wine: Wine) => void; // +6 Flaschen
  addDoubleCase: (wine: Wine) => void; // +12 Flaschen
  removeBottles: (wineId: string, count?: number) => void;
  updateQuantity: (wineId: string, quantity: number) => void;
  removeItem: (wineId: string) => void;
  clearCart: () => void;

  // UI Dialog States
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedWineForModal: Wine | null;
  setSelectedWineForModal: (wine: Wine | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isOrderHistoryOpen: boolean;
  setIsOrderHistoryOpen: (open: boolean) => void;
  completedOrder: Order | null;
  setCompletedOrder: (order: Order | null) => void;

  // Verkäufer-Verwaltung am Tablet
  activeSeller: Seller;
  setActiveSeller: (seller: Seller) => void;

  // Berechnungen & Kartonregel
  summary: CartSummary;
  cartonValidation: CartonValidationResult;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'kaisergarten_cart_items';
const SELLER_STORAGE_KEY = 'kaisergarten_active_seller_id';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? restoreCatalogCart(JSON.parse(saved), CATALOG) : [];
    } catch {
      return [];
    }
  });

  const [activeSeller, setActiveSellerState] = useState<Seller>(() => {
    try {
      const savedId = localStorage.getItem(SELLER_STORAGE_KEY);
      if (savedId) {
        const found = DEMO_SELLERS.find((s) => s.id === savedId);
        if (found) return found;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_DEMO_SELLER;
  });

  const setActiveSeller = (seller: Seller) => {
    setActiveSellerState(seller);
    try {
      localStorage.setItem(SELLER_STORAGE_KEY, seller.id);
    } catch (e) {
      console.warn('Could not persist seller to localStorage', e);
    }
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedWineForModal, setSelectedWineForModal] = useState<Wine | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not persist cart to localStorage', e);
    }
  }, [items]);

  const addItem = (wine: Wine, count: number = 1) => {
    if (!isOrderableWine(wine) || !Number.isSafeInteger(count) || count <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.wine.id === wine.id);
      if (existing) {
        return prev.map((i) =>
          i.wine.id === wine.id ? { ...i, quantity: i.quantity + count } : i
        );
      }
      return [...prev, { wine, quantity: count }];
    });
  };

  const addCase = (wine: Wine) => {
    addItem(wine, wine.caseSize || 6);
  };

  const addDoubleCase = (wine: Wine) => {
    addItem(wine, (wine.caseSize || 6) * 2);
  };

  const removeBottles = (wineId: string, count: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.wine.id === wineId);
      if (!existing) return prev;
      if (existing.quantity <= count) {
        return prev.filter((i) => i.wine.id !== wineId);
      }
      return prev.map((i) =>
        i.wine.id === wineId ? { ...i, quantity: i.quantity - count } : i
      );
    });
  };

  const updateQuantity = (wineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(wineId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.wine.id === wineId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (wineId: string) => {
    setItems((prev) => prev.filter((i) => i.wine.id !== wineId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartonValidation = useMemo(() => {
    return validateCartonRule(items);
  }, [items]);

  // Exakte Berechnung mit ganzzahligen Rappen & Schweizer 5-Rappen-Rundung
  const summary: CartSummary = useMemo(() => {
    let totalBottles = 0;
    let rawSubtotalRappen = 0;
    let cartonDiscountRappen = 0;

    for (const item of items) {
      totalBottles += item.quantity;
      const unitPriceRappen = chfToRappen(item.wine.priceCHF);
      const itemRawTotalRappen = unitPriceRappen * item.quantity;
      rawSubtotalRappen += itemRawTotalRappen;

      // Demo-Kartonrabatt (unbestätigte Annahme)
      const caseSize = item.wine.caseSize || 6;
      if (item.wine.casePriceCHF) {
        const fullCases = Math.floor(item.quantity / caseSize);
        const casePriceRappen = chfToRappen(item.wine.casePriceCHF);
        const normalCaseRappen = unitPriceRappen * caseSize;
        const discountPerCase = Math.max(0, normalCaseRappen - casePriceRappen);
        cartonDiscountRappen += fullCases * discountPerCase;
      }
    }

    // Demo-Messerabatt: Ab 12 Flaschen (5% unbestätigte Annahme)
    const subtotalAfterCases = rawSubtotalRappen - cartonDiscountRappen;
    let messeBonusRappen = 0;
    if (totalBottles >= 12) {
      messeBonusRappen = Math.round(subtotalAfterCases * 0.05);
    }

    const totalDiscountRappen = cartonDiscountRappen + messeBonusRappen;
    const netCalculatedRappen = Math.max(0, rawSubtotalRappen - totalDiscountRappen);

    // Schweizer 5-Rappen-Rundung nur auf den Zahlbetrag
    const finalTotalRappen = roundRappen5(netCalculatedRappen);
    const mwstRappen = Math.round(finalTotalRappen - finalTotalRappen / 1.081);

    const totalCases = Math.floor(totalBottles / 6);
    const singleBottlesRemainder = totalBottles % 6;

    return {
      totalBottles,
      totalCases,
      singleBottlesRemainder,
      rawSubtotalCHF: rappenToCHF(rawSubtotalRappen),
      rawSubtotalRappen,
      cartonDiscountCHF: rappenToCHF(totalDiscountRappen),
      cartonDiscountRappen: totalDiscountRappen,
      netTotalCHF: rappenToCHF(finalTotalRappen - mwstRappen),
      netTotalRappen: finalTotalRappen - mwstRappen,
      mwstCHF: rappenToCHF(mwstRappen),
      mwstRappen,
      finalTotalCHF: rappenToCHF(finalTotalRappen),
      finalTotalRappen,
      cartonValidation,
    };
  }, [items, cartonValidation]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addCase,
        addDoubleCase,
        removeBottles,
        updateQuantity,
        removeItem,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        selectedWineForModal,
        setSelectedWineForModal,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isOrderHistoryOpen,
        setIsOrderHistoryOpen,
        completedOrder,
        setCompletedOrder,
        activeSeller,
        setActiveSeller,
        summary,
        cartonValidation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
