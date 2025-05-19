import {createSlice} from "@reduxjs/toolkit";

const initialState= {
    reservations: [],
    privateDining: [],
};

const adminSlice= createSlice({
    name: "admin",
    initialState,
    reducers: {
        setReservations: (state, action)=>{
            state.reservations= action.payload;
        },
        setPrivateDining: (state,action)=>{
            state.privateDining=action.payload;
        },
        deleteReservation: (state,action)=>{
            state.reservations= state.reservations.filter(
                (res)=>res.id !==action.payload
            );
        },
        deletePrivateDining:(state,action)=>{
            state.privateDining= state.privateDining.filter(
                (res)=>res.id ===action.payload
            );
        },
        updateReservation: (state,action)=>{
            const index= state.reservations.findIndex(
                (res)=>res.id ===action.payload.id
            );
            if(index !==-1){
                state.reservations[index]= action.payload;
            }
        },
        updatePrivateDining:(state,action)=>{
            const index= state.privateDining.findIndex(
                (req)=> req.id ===action.payload.id
            );
            if(index !==-1){
                state.privateDining[index]= action.payload;
            }
        },
    },
});

export const {
    setReservations,
    setPrivateDining,
    deleteReservation,
    deletePrivateDining,
    updateReservation,
    updatePrivateDining,
} = adminSlice.actions;

export default adminSlice.reducer;