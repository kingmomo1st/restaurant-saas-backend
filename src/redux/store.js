import { configureStore } from "@reduxjs/toolkit";
import userReducer  from './userSlice';
import cartReducer from "./cartSlice";
import orderReducer from "./orderSlice";
import reservationReducer from "./reservationSlice";
import privateDiningReducer from "./privateDiningSlice"
import adminSliceReducer from "./adminSlice"
import categoryFilterReducer from "./categoryFilterSlice"
import promoCodeSliceReducer from "./promoCodeSlice"
import locationSliceReducer from "./locationSlice"
import franchiseSliceReducer from "./franchiseSlice"
import tableSliceReducer from "./tableSlice"


const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    order: orderReducer,
    reservations: reservationReducer,
    privateDining: privateDiningReducer,
    admin: adminSliceReducer,
    categoryFilter: categoryFilterReducer,
    promo: promoCodeSliceReducer,
    location: locationSliceReducer,
    franchise: franchiseSliceReducer,
    table: tableSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["user/setUser"],
        ignoredPaths: ["user.user"],
      },
    }),
});

export default store ;