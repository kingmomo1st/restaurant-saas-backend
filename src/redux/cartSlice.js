import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
  orderType: "pickup", // default to pickup
  deliveryFee: 0,       // used only if orderType is delivery
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const item = action.payload;
      const sameModifiers = (a, b) =>
        JSON.stringify(a || []) === JSON.stringify(b || []);

      const existingItem = state.items.find(
        (i) =>
          i.id === item.id &&
          (i.size || "default") === (item.size || "default") &&
          sameModifiers(i.modifiers, item.modifiers)
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          ...item,
          modifiers: item.modifiers || [],
          quantity: 1,
        });
      }

      state.totalQuantity += 1;
      state.totalPrice += item.price;
    },

    removeFromCart(state, action) {
      const { id, size, modifiers } = action.payload;
      const sameModifiers = (a, b) =>
        JSON.stringify(a || []) === JSON.stringify(b || []);

      const existingItem = state.items.find(
        (i) =>
          i.id === id &&
          (i.size || "default") === (size || "default") &&
          sameModifiers(i.modifiers, modifiers)
      );

      if (existingItem) {
        state.totalQuantity -= existingItem.quantity;
        state.totalPrice -= existingItem.price * existingItem.quantity;
        state.items = state.items.filter(
          (i) =>
            !(
              i.id === id &&
              (i.size || "default") === (size || "default") &&
              sameModifiers(i.modifiers, modifiers)
            )
        );
      }
    },

    updateItemQuantity(state, action) {
      const { id, size, modifiers, quantity } = action.payload;
      const sameModifiers = (a, b) =>
        JSON.stringify(a || []) === JSON.stringify(b || []);

      const item = state.items.find(
        (i) =>
          i.id === id &&
          (i.size || "default") === (size || "default") &&
          sameModifiers(i.modifiers, modifiers)
      );

      if (item && quantity > 0) {
        state.totalQuantity += quantity - item.quantity;
        state.totalPrice += (quantity - item.quantity) * item.price;
        item.quantity = quantity;
      }
    },

    decreaseQuantity(state, action) {
      const { id, size, modifiers } = action.payload;
      const sameModifiers = (a, b) =>
        JSON.stringify(a || []) === JSON.stringify(b || []);

      const item = state.items.find(
        (i) =>
          i.id === id &&
          (i.size || "default") === (size || "default") &&
          sameModifiers(i.modifiers, modifiers)
      );

      if (item && item.quantity > 1) {
        item.quantity -= 1;
        state.totalQuantity -= 1;
        state.totalPrice -= item.price;
      }
    },

    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
      state.orderType = "pickup";
      state.deliveryFee = 0;
    },

    setOrderType(state, action) {
      state.orderType = action.payload;
    },

    setDeliveryFee(state, action) {
      state.deliveryFee = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  decreaseQuantity,
  clearCart,
  updateItemQuantity,
  setOrderType,
  setDeliveryFee,
} = cartSlice.actions;

export default cartSlice.reducer;