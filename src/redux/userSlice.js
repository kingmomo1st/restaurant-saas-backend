import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAdmin: false,
  isSuperAdmin: false, // ✅ NEW
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAdmin = action.payload?.isAdmin || false;
      state.isSuperAdmin = action.payload?.isSuperAdmin || false; // ✅ NEW
    },
    clearUser(state) {
      state.user = null;
      state.isAdmin = false;
      state.isSuperAdmin = false; // ✅ Reset
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setUser,
  clearUser,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;