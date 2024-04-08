import {createSlice} from "@reduxjs/toolkit";

const today = new Date();
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(0, 0, 0, 0);

const initialState = {
  startDateTS: yesterday.getTime(),
  endDateTS: today.getTime(),
}


const slice = createSlice({
  name: 'dates',
  initialState,
  reducers: {
    changeDateRange(state, action) {
      state.startDateTS = action.payload.startDateTS;
      state.endDateTS = action.payload.endDateTS;
    },
  }
});

export const {changeDateRange} = slice.actions;
export default slice.reducer;
