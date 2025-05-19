import { configureStore } from "@reduxjs/toolkit";
import userReducer  from './userSlice';
import cartReducer from "./cartSlice";
import orderReducer from "./orderSlice";
import reservationReducer from "./reservationSlice";
import privateDiningReducer from "./privateDiningSlice"
import adminSliceReducer from "./adminSlice"
import categoryFilterReducer from "./categoryFilterSlice"


const store= configureStore ({
    reducer: {
        user: userReducer,
        cart: cartReducer,
        order: orderReducer,
        reservations: reservationReducer,
        privateDining: privateDiningReducer,
        admin: adminSliceReducer,
        categoryFilter: categoryFilterReducer,
    }
});


export default store ;