// src/redux/franchiseSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Just add localStorage loading like your locationSlice does
const savedFranchise = localStorage.getItem('selectedFranchise');
const initialFranchise = savedFranchise ? JSON.parse(savedFranchise) : null;

const franchiseSlice = createSlice({
  name: 'franchise',
  initialState: {
    selectedFranchise: initialFranchise, // Only change: load from localStorage instead of null
  },
  reducers: {
    setSelectedFranchise: (state, action) => {
      state.selectedFranchise = action.payload;
      // Only addition: save to localStorage like locationSlice does
      localStorage.setItem('selectedFranchise', JSON.stringify(action.payload));
    },
  },
});

export const { setSelectedFranchise } = franchiseSlice.actions;
export default franchiseSlice.reducer;