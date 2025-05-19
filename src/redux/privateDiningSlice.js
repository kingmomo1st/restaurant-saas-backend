import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Fetch private dining
export const fetchPrivateDining = createAsyncThunk(
  "privateDining/fetchPrivateDining",
  async () => {
    const res = await fetch("/api/private-dining");
    const data = await res.json();
    return data;
  }
);

// Delete private dining
export const deletePrivateDining = createAsyncThunk(
  "privateDining/deletePrivateDining",
  async (id) => {
    await fetch(`/api/private-dining/${id}`, { method: "DELETE" });
    return id;
  }
);

// Update private dining
export const updatePrivateDining = createAsyncThunk(
  "privateDining/updatePrivateDining",
  async (privateDiningData) => {
    const res = await fetch(`/api/private-dining/${privateDiningData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(privateDiningData),
    });
    return await res.json();
  }
);

const initialState = {
  privateDining: [],
  loading: false,
  error: null,
};

const privateDiningSlice = createSlice({
  name: "privateDining",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrivateDining.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPrivateDining.fulfilled, (state, action) => {
        state.loading = false;
        state.privateDining = action.payload;
      })
      .addCase(fetchPrivateDining.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deletePrivateDining.fulfilled, (state, action) => {
        state.privateDining = state.privateDining.filter(
          (r) => r.id !== action.payload
        );
      })
      .addCase(updatePrivateDining.fulfilled, (state, action) => {
        state.privateDining = state.privateDining.map((r) =>
          r.id === action.payload.id ? action.payload : r
        );
      });
  },
});

export default privateDiningSlice.reducer;