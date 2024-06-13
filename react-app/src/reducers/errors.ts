import {createSlice} from "@reduxjs/toolkit";

const initialState = {
  errorMessage: null,
  incr: 0
}

const slice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    setErrorMessage(state, action) {
      state.errorMessage = action.payload;
      state.incr += 1;
    },
    clearErrorMessage(state) {
      state.errorMessage = null;
      state.incr = 0;
    }
  }
});

export const {setErrorMessage, clearErrorMessage } = slice.actions;
export default slice.reducer;
