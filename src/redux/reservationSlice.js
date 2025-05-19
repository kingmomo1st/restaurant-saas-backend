import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Fetch reservations from backend
export const fetchReservations = createAsyncThunk(
  "reservations/fetchReservations",
  async () => {
    const res = await fetch("/api/reservations");
    const data = await res.json();
    return data;
  }
);

// Delete reservation
export const deleteReservation = createAsyncThunk(
  "reservations/deleteReservation",
  async (id) => {
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    return id;
  }
);

// Update reservation
export const updateReservation = createAsyncThunk(
  "reservations/updateReservation",
  async (reservationData) => {
    const res = await fetch(`/api/reservations/${reservationData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reservationData),
    });
    return await res.json();
  }
);

const initialState = {
  reservations: [],
  loading: false,
  error: null,
};

const reservationSlice = createSlice({
  name: "reservations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.reservations = state.reservations.filter(
          (r) => r.id !== action.payload
        );
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.reservations = state.reservations.map((r) =>
          r.id === action.payload.id ? action.payload : r
        );
      });
  },
});

export default reservationSlice.reducer;