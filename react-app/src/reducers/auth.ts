import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import axios, {InternalAxiosRequestConfig} from "axios";
import {InvalidTokenError, jwtDecode, JwtPayload} from "jwt-decode";


export const refreshAuthToken = createAsyncThunk<string, void, { state: { auth: AuthState } }>('auth/refreshToken', async (_, {getState}) => {
  const response = await fetch(`https://${import.meta.env.VITE_REACT_APP_HOST}/auth/refresh`, {
    method: 'GET',
    credentials: 'include',
    timeout: 2000,
  });
  const data = await response.json();
  if (!response.ok) {
    let detail = 'Unknown error';
    if (response.status === 401) {
      detail = data.detail;
      if (detail === 'Refresh token is not valid') {
        console.log("Refresh token is not valid");
        return null;
      }
    }
    throw new InvalidTokenError(detail);
  }
  return data.access_token;
});


function deleteCookie(name, path, domain) {
  if (path === undefined) {
    path = '/';
  }
  if (domain === undefined) {
    domain = location.host;
  }
  
  // Set the cookie with an expired date
  document.cookie = `${name}=; Path=${path}; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure;`;
}


interface TokenPayload extends JwtPayload {
  scopes: string[];
}


export interface AuthState {
  isFirstEntry: boolean;
  token: string | null;
  isRefreshing: boolean;
  scopes: string[];
}

const initialState: AuthState = {
  isFirstEntry: true,
  token: localStorage.getItem("token"),
  isRefreshing: false,
  scopes: [],
}


const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken(state: AuthState, action: PayloadAction<string>) {
      const token = action.payload;
      state.token = token;
      localStorage.setItem("token", token);
      state.scopes = (jwtDecode(token) as TokenPayload).scopes;
      state.isFirstEntry = false;
    },
    clearAuthToken(state: AuthState) {
      state.isFirstEntry = true;
      state.token = null;
      state.scopes.length = 0;
      deleteCookie("use_refresh_token", "/auth", import.meta.env.VITE_REACT_APP_DOMAIN);
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder.addCase(refreshAuthToken.pending, (state: AuthState) => {
      console.log("refreshAuthToken.pending");
      state.isRefreshing = true;
      state.isFirstEntry = false;
    });
    builder.addCase(refreshAuthToken.fulfilled, (state: AuthState, action: PayloadAction<string>) => {
      console.log("refreshAuthToken.fulfilled");
      const token = action.payload;
      // if (!token || (token && token === 'undefined')) {
      //   console.log("token is undefined");
      //   state.isFirstEntry = true;
      //   state.isRefreshing = false;
      //   state.scopes.length = 0;
      //   state.token = null;
      //   deleteCookie("use_refresh_token", "/auth", import.meta.env.VITE_REACT_APP_DOMAIN);
      //   localStorage.removeItem("token");
      //   document.location.href = "/login";
      //   return;
      // }
      if (token) {
        state.token = token;
        localStorage.setItem("token", token);
        state.scopes = (jwtDecode(token) as TokenPayload).scopes;
      }
      state.isRefreshing = false;
    });
    builder.addCase(refreshAuthToken.rejected, (state: AuthState) => {
      console.log("refreshAuthToken.rejected");
      state.isFirstEntry = true;
      state.isRefreshing = false;
      state.scopes.length = 0;
      state.token = null;
      localStorage.removeItem("token");
      document.location.href = "/login";
    });
  }
});


export const { setAuthToken, clearAuthToken } = slice.actions;
export default slice.reducer;
