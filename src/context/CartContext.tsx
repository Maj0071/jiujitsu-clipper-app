import React, { createContext, useContext, useState } from 'react';

// Define the shape of a cart item
type CartItem = {
  courseId: string;
  title: string;
  priceId: string;
  priceLabel: string;
};

// Context value types
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (courseId: string) => void;
  clear: () => void;
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Explicitly type the provider's children
interface CartProviderProps {
  children: React.ReactNode;
}

// Provider component
export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      if (prev.find(x => x.courseId === item.courseId)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (courseId: string) => {
    setItems(prev => prev.filter(x => x.courseId !== courseId));
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to consume the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
