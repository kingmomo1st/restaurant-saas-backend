import {createSlice} from "@reduxjs/toolkit";

const initialState= {
    selectedCategory:"pizza",
}

const categoryFilterSlice= createSlice({
    name:"categoryFilter",
    initialState,
    reducers:{
        setCategory:(state,action)=>{
            state.selectedCategory= action.payload;
        },
    },
});

export const {setCategory}= categoryFilterSlice.actions;
export default categoryFilterSlice.reducer;