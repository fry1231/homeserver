import {createSlice} from "@reduxjs/toolkit";

const initialState: { token: string | null } = {
  token: localStorage.getItem("token"),
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action) {
      const token = action.payload;
      console.log("setting token", token);
      state.token = token;
      localStorage.setItem("token", token);
    },
    clearToken(state) {
      state.token = null;
      localStorage.removeItem("token");
    },
  }
});

export const { setToken, clearToken } = slice.actions;
export default slice.reducer;
