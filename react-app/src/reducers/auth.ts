import {createSlice} from "@reduxjs/toolkit";

const initialState: {token: null | string} = {
  token: null,
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action) {
      state.token = action.payload.token;
    },
    clearToken(state) {
      state.token = null;
    }
  }
});

export const { setToken, clearToken } = slice.actions;
export default slice.reducer;
