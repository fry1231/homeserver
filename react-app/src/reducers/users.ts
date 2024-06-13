import {createSlice} from "@reduxjs/toolkit";


interface User {
  uuid: string;
  username: string;
  hashed_password: string;
  email: string;
  scopes: string;
}

const initialState = {
  currentUser: {} as User,
};

const slice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUser(state, action) {
      state.currentUser = action.payload;
    }
  }
});

export const {setUser} = slice.actions;

export default slice.reducer;