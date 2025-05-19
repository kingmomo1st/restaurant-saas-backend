import {createSlice} from "@reduxjs/toolkit"

const initialState= {
    items: [],
    totalQuantity:0,
    totalPrice:0
};

const cartSlice= createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart(state,action){
            const item= action.payload;
            const itemKey= `${item.id}_${item.size || "default"}`;
            const existingItem= state.items.find(i=> `${i.id}_${i.size || "default"}`===itemKey);

            if(existingItem){
                existingItem.quantity +=1;
            }else{
                state.items.push({...item, quantity:1});
            }

            state.totalQuantity +=1;
            state.totalPrice += item.price;
        },
        removeFromCart(state,action){
           const {id,size}= action.payload;
           const existingItem= state.items.find(i=>i.id===id && i.size ===size);

           if(existingItem){
            state.totalQuantity -= existingItem.quantity;
            state.totalPrice -= existingItem.price * existingItem.quantity;
            state.items= state.items.filter(i=> !(i.id=== id && i.size===size));
           }
        },
        updateItemQuantity(state,action){
            const {id, size, quantity}= action.payload;
            const item= state.items.find(i =>i.id ===id && i.size===size);

            if (item && quantity>0){
                state.totalQuantity += quantity - item.quantity;
                state.totalPrice +=(quantity-item.quantity)* item.price;

                item.quantity= quantity;
            }
        },

        decreaseQuantity(state,action){
            const {id,size}= action.payload;
            const item= state.items.find(i =>i.id ===id && i.size===size);

            if(item && item.quantity>1){
                item.quantity -=1;
                state.totalQuantity -=1;
                state.totalPrice -=item.price;
            }
        },
        clearCart(state){
            state.items= [];
            state.totalQuantity=0;
            state.totalPrice=0;
        }
    }
});

export const {addToCart, removeFromCart,decreaseQuantity,clearCart, updateItemQuantity}= cartSlice.actions;

export default cartSlice.reducer;