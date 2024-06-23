import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import axios, {InternalAxiosRequestConfig} from "axios";
import {jwtDecode, JwtPayload} from "jwt-decode";


export const refreshAuthToken = createAsyncThunk<string, void, { state: { auth: AuthState } }>('auth/refreshToken', async (_, {getState}) => {
  const response = await fetch(`https://${import.meta.env.VITE_REACT_APP_HOST}/auth/refresh`, {
    method: 'GET',
    credentials: 'include',
    timeout: 2000,
  });
  const data = await response.json();
  return data.access_token;
});


interface TokenPayload extends JwtPayload {
  scopes: string[];
}


export interface AuthState {
  isFirstEntry: boolean;
  token: string | null;
  isRefreshing: boolean;
  requestQueue: InternalAxiosRequestConfig[];
  scopes: string[];
}

const initialState: AuthState = {
  isFirstEntry: true,
  token: localStorage.getItem("token"),
  isRefreshing: false,
  requestQueue: [],
  scopes: [],
}


const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken(state: AuthState, action: PayloadAction<string>) {
      const token = action.payload;
      state.token = token;
      state.scopes = (jwtDecode(token) as TokenPayload).scopes;
      state.isFirstEntry = false;
      localStorage.setItem("token", token);
    },
    clearAuthToken(state: AuthState) {
      state.token = null;
      state.scopes.length = 0;
      localStorage.removeItem("token");
    },
    addToRequestQueue(state: AuthState, action: PayloadAction<InternalAxiosRequestConfig>) {
      // Don't add the same request multiple times
      if (!state.requestQueue.some((request) => request.url === action.payload.url)) {
        state.requestQueue.push(action.payload);
      }
    },
    clearRequestQueue(state) {
      state.requestQueue.length = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(refreshAuthToken.pending, (state: AuthState) => {
      console.log("refreshAuthToken.pending");
      state.isRefreshing = true;
    });
    builder.addCase(refreshAuthToken.fulfilled, (state: AuthState, action) => {
      console.log("refreshAuthToken.fulfilled");
      const token = action.payload;
      state.token = token;
      state.isRefreshing = false;
      state.scopes = (jwtDecode(token) as TokenPayload).scopes;
      // Execute all queued requests with the new token
      state.requestQueue.forEach((request: InternalAxiosRequestConfig, i: number) => {
        console.log("Executing queued request #", i);
        request.headers.Authorization = `Bearer ${action.payload}`;
        axios(request);
      });
      state.requestQueue.length = 0;
    });
    builder.addCase(refreshAuthToken.rejected, (state: AuthState) => {
      console.log("refreshAuthToken.rejected");
      state.isFirstEntry = true;
      state.isRefreshing = false;
      state.requestQueue.length = 0;
      state.scopes.length = 0;
      state.token = null;
      localStorage.removeItem("token");
    });
  }
});


export const { setAuthToken, clearAuthToken, clearRequestQueue, addToRequestQueue } = slice.actions;
export default slice.reducer;
