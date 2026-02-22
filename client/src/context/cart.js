import React, { useState, useContext, createContext, useEffect } from "react";

const CartContext = createContext();
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    try {
      let existingCartItem = localStorage.getItem("cart");
      if (existingCartItem) setCart(JSON.parse(existingCartItem));
    } catch (error) {
      console.log("Error loading cart from localStorage:", error);
    }
  }, []);

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };
