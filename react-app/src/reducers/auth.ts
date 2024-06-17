import {createSlice} from "@reduxjs/toolkit";

const initialState: { token: string | null, isRefreshing: boolean } = {
  token: localStorage.getItem("token"),
  isRefreshing: false,
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action) {
      const token = action.payload;
      state.token = token;
      localStorage.setItem("token", token);
      state.isRefreshing = false;
    },
    clearToken(state) {
      state.token = null;
      localStorage.removeItem("token");
    },
    setIsRefreshing(state, action) {
      state.isRefreshing = action.payload;
    }
  }
});

export const { setToken, clearToken, setIsRefreshing } = slice.actions;
export default slice.reducer;
