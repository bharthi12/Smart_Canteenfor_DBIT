import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'smart_canteen_cart';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  function addToCart(dish, quantity = 1) {
    if (!dish.available) return;

    setCartItems(prev => {
      const existing = prev.find(item => item.dishId === dish.id);
      if (existing) {
        const newQty = Math.min(20, existing.quantity + quantity);
        return prev.map(item =>
          item.dishId === dish.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, {
        dishId: dish.id,
        name: dish.name,
        price: Number(dish.price),
        imageUrl: dish.imageUrl,
        category: dish.category,
        quantity: Math.min(20, quantity),
      }];
    });
  }

  function updateQuantity(dishId, newQty) {
    if (newQty <= 0) {
      removeFromCart(dishId);
      return;
    }
    const clampedQty = Math.min(20, newQty);
    setCartItems(prev =>
      prev.map(item => item.dishId === dishId ? { ...item, quantity: clampedQty } : item)
    );
  }

  function removeFromCart(dishId) {
    setCartItems(prev => prev.filter(item => item.dishId !== dishId));
  }

  function clearCart() {
    setCartItems([]);
  }

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalCount,
    totalAmount,
    getItemQuantity: (dishId) => {
      const item = cartItems.find(i => i.dishId === dishId);
      return item ? item.quantity : 0;
    }
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
