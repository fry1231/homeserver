import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    busData: [],
    fastRefresh: false
};

const busesSlice = createSlice({
    name: 'buses',
    initialState,
    reducers: {
        busDataUpdated(state, action) {
            state.busData = action.payload;
        },
        speedUpRefresh(state, action) {
            state.fastRefresh = action.payload;
        },
    }
});

export const { busDataUpdated, speedUpRefresh } = busesSlice.actions;

export default busesSlice.reducer;