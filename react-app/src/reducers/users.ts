import {createSlice} from "@reduxjs/toolkit";


interface User {
  uuid: string;
  username: string;
  hashed_password: string;
  email: string;
  is_admin: boolean;
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