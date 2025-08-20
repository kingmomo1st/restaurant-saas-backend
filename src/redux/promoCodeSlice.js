// redux/promoCodeSlice.js
import { createSlice } from "@reduxjs/toolkit";

const promoCodeSlice = createSlice({
  name: "promoCode",
  initialState: {
    code: null,
    discountType: null,
    discountValue: 0,
    minOrderAmount: null,
    applicableCategories: [],
  },
  reducers: {
    applyPromoCode: (state, action) => {
      const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        applicableCategories,
      } = action.payload;

      state.code = code;
      state.discountType = discountType;
      state.discountValue = discountValue;
      state.minOrderAmount = minOrderAmount || null;
      state.applicableCategories = applicableCategories || [];
    },
    clearPromoCode: (state) => {
      state.code = null;
      state.discountType = null;
      state.discountValue = 0;
      state.minOrderAmount = null;
      state.applicableCategories = [];
    },
  },
});

export const { applyPromoCode, clearPromoCode } = promoCodeSlice.actions;
export default promoCodeSlice.reducer;