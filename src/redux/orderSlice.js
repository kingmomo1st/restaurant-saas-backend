import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios"

export const placeOrder= createAsyncThunk(
    "order/placeOrder",
    async(orderData, thunkAPI)=>{
        try {
            const response= await axios.post("/api/orders", orderData); //replace with real backend URL
            return response.data;   
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data || error.message); 
        }
    }
);

const orderSlice= createSlice ({
    name:"order",
    initialState: {
        order:[],
        loading:false,
        error:null,
        successMessage: null
    },
    reducers: {
        clearOrders(state){
            state.orders= [];
        },
        setOrders(state,action){
            state.orders= action.payload;
        }
    },
    extraReducers: builder => {
        builder
        .addCase(placeOrder.pending, state=>{
            state.loading=true;
            state.error=null;
            state.successMessage= null;
        })
        .addCase(placeOrder.fulfilled, (state, action)=>{
            state.loading=false;
            state.orders.push(action.payload);
            state.successMessage= "Order placed successfully";
        })
        .addCase(placeOrder.rejected, (state,actions)=>{
            state.loading= false;
            state.error= actions.payload || "Failed to place order";
        });
    }
});

export const {clearOrders, setOrders}= orderSlice.actions;

export default orderSlice.reducer;