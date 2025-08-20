import { createSlice } from '@reduxjs/toolkit';

const savedLocation = localStorage.getItem('selectedLocation');
const initialLocation = savedLocation ? JSON.parse(savedLocation) : null;

const locationSlice = createSlice({
  name: 'location',
  initialState: {
    selectedLocation: initialLocation,
    selectedTableId: null, // ✅ NEW: Track table ID from QR
  },
  reducers: {
    setSelectedLocation: (state, action) => {
      state.selectedLocation = action.payload;
      localStorage.setItem('selectedLocation', JSON.stringify(action.payload));
    },
    setSelectedTableId: (state, action) => {
      state.selectedTableId = action.payload; // ✅ NEW: Save tableId to Redux
    },
  },
});

export const { setSelectedLocation, setSelectedTableId } = locationSlice.actions;
export default locationSlice.reducer;