import {createSlice} from "@reduxjs/toolkit";

const initialState= {
    user:null,
    isAdmin: false,
    loading:false,
    error:null
};

const userSlice= createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser(state, action){
            state.user= action.payload;
            state.isAdmin=action.payload?.isAdmin || false;
        },
        clearUser(state){
            state.user=null;
            state.isAdmin= false;
        },
        setLoading(state, action){
            state.loading= action.payload;
        },
        setError(state,action){
            state.error= action.payload
        }
    }
});

export const { setUser, clearUser, setLoading,setError}=userSlice.actions;

export default userSlice.reducer