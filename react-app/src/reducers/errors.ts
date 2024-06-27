import {createSlice} from "@reduxjs/toolkit";

export interface ErrorsState {
  successMessage: string | null;
  warningMessage: string | null;
  errorMessage: string | null;
  incr: number;
}

const initialState: ErrorsState = {
  successMessage: null,
  warningMessage: null,
  errorMessage: null,
  incr: 0
}

const slice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    setSuccessMessage(state: ErrorsState, action: { payload: string }) {
      state.successMessage = action.payload;
      state.incr += 1;
    },
    setWarningMessage(state: ErrorsState, action: { payload: string }) {
      state.warningMessage = action.payload;
      state.incr += 1;
    },
    setErrorMessage(state: ErrorsState, action: { payload: string }) {
      state.errorMessage = action.payload;
      state.incr += 1;
    },
    clearAllMessages(state: ErrorsState) {
      state.errorMessage = null;
      state.warningMessage = null;
      state.successMessage = null;
      state.incr = 0;
    }
  }
});

export const { setErrorMessage, setWarningMessage, setSuccessMessage, clearAllMessages } = slice.actions;
export default slice.reducer;
