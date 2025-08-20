import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tableId: localStorage.getItem("qr_tableId") || null,
  locationId: localStorage.getItem("qr_locationId") || null,
};

const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setTableId: (state, action) => {
      state.tableId = action.payload;
      localStorage.setItem("qr_tableId", action.payload);
    },
    setLocationId: (state, action) => {
      state.locationId = action.payload;
      localStorage.setItem("qr_locationId", action.payload);
    },
    clearTableSession: (state) => {
      state.tableId = null;
      state.locationId = null;
      localStorage.removeItem("qr_tableId");
      localStorage.removeItem("qr_locationId");
    },
  },
});

export const { setTableId, setLocationId, clearTableSession } = tableSlice.actions;

export default tableSlice.reducer;