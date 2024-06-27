import axiosBase, {InternalAxiosRequestConfig, AxiosInstance, AxiosResponse, AxiosError} from "axios";
import {clearAuthToken, refreshAuthToken} from "../reducers/auth";
import {setErrorMessage} from "../reducers/errors";
import {store} from "../Store";
import {getNewToken, refreshFinishedToken} from "./utils";


interface AxiosRequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance: AxiosInstance = axiosBase.create({
  baseURL: `https://${import.meta.env.VITE_REACT_APP_HOST}`,
  timeout: 2000,
});


axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('Request ' + config.url);
    // const isFirstEntry = store.getState().auth.isFirstEntry;
    // if (isFirstEntry) {
    //   Promise.reject('First entry');
    // }
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;
    let newToken: string | null = null;
    
    // 401 errors - refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('handling 401 error')
      console.log(store.getState().auth);
      originalRequest._retry = true;
      const isRefreshing = store.getState().auth.isRefreshing;
      if (!isRefreshing) {
        try {
          // If not already refreshing, refresh the token
          newToken = await getNewToken();
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          store.dispatch(setErrorMessage('Could not refresh token. Please log in again.'));
          store.dispatch(clearAuthToken());
          return Promise.reject(refreshError);
        }
      } else {
        // Prevent infinite loop on refresh error
        if (originalRequest.url === '/auth/refresh') {
          store.dispatch(setErrorMessage('Could not refresh token. Please log in again.'));
          store.dispatch(clearAuthToken());
          return Promise.reject('Token refresh failed')
        } else {
          // If already refreshing, wait for the token to be refreshed and retry the original request
          newToken = await getNewToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      }
    }
    // 400 errors - display error message in UI directly from response detail
    if (error.response && error.response.status === 400 && error.response.data.detail) {
      store.dispatch(setErrorMessage(error.response.data.detail));
    }
    // Other errors will throw an error
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const getAxiosClient = () => {
  return axiosInstance;
}