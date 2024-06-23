import axiosBase, {InternalAxiosRequestConfig, AxiosInstance, AxiosResponse, AxiosError} from "axios";
import {createContext, useContext} from "react";
import {addToRequestQueue, clearAuthToken, clearRequestQueue, refreshAuthToken} from "../reducers/auth";
import {setErrorMessage as setErrorMessage_} from "../reducers/errors";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import {store} from "../Store";


// interface RetryQueueItem {
//   resolve: (value?: any) => void;
//   reject: (error?: any) => void;
//   config: AxiosRequestConfig;
// }


// const AxiosContext = createContext<AxiosInstance>(
//   axiosBase.create({
//     baseURL: `https://${import.meta.env.VITE_REACT_APP_HOST}`,
//   })
// );

interface AxiosRequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance = axiosBase.create({
  baseURL: `https://${import.meta.env.VITE_REACT_APP_HOST}`,
  timeout: 2000,
});


axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isFirstEntry = store.getState().auth.isFirstEntry;
    if (isFirstEntry) {
      Promise.reject('First entry');
    }
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const isRefreshing = store.getState().auth.isRefreshing;
      if (!isRefreshing) {
        try {
          console.log('Refreshing in axios');
          await store.dispatch(refreshAuthToken()).unwrap();
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.log('Error refreshing token');
          store.dispatch(clearRequestQueue());
          store.dispatch(setErrorMessage_('Could not refresh token. Please log in again.'));
          store.dispatch(clearAuthToken());
          return Promise.reject(refreshError);
        }
      } else {
        if (originalRequest.url !== '/auth/refresh') {
          console.log('Postponing request ', originalRequest.url);
          return new Promise((resolve, reject) => {
            store.dispatch(addToRequestQueue({
              ...originalRequest,
              resolve,
              reject
            }));
          }).then(
            console.log('Retrying postponed request ', originalRequest.url),
            token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            }
          );
        }
      }
    }
    return Promise.reject(error);
  }
);
export default axiosInstance;

// const AxiosProvider = ({children}) => {
//   const {token, isRefreshing} = useSelector((state) => state.auth);
//   let newToken = null;
//   const postponedRequests: RetryQueueItem[] = [];
//   const dispatch = useDispatch();
//   const setErrorMessage = (message: string) => dispatch(setErrorMessage_(message));
//   const navigate = useNavigate();
//
//   if (!isRefreshing) {
//     if (token)
//       console.log('AxiosProvider, token is ', token.slice(-5));
//
//     // Create axios instance
//     const protocol = import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? 'https' : 'http';
//     const instance = axiosBase.create({
//       baseURL: `${protocol}://${import.meta.env.VITE_REACT_APP_HOST}`,
//       timeout: 2000,
//     });
//
//     instance.interceptors.request.use((config) => {
//       console.log('request ' + config.url, config);
//       // If newToken is available, but have not yet updated in the redux store, set it in the request explicitly
//       if (newToken && config.headers.Authorization && !config.headers.Authorization.includes(newToken)) {
//         config.headers['Authorization'] = `Bearer ${newToken}`;
//       } else {
//         config.headers['Authorization'] = `Bearer ${token}`;
//       }
//       return config;
//     }, (error) => {
//       console.error('error request', error);
//     });
//
//     instance.interceptors.response.use((response) => response,
//       async (error) => {
//         if (
//           error.response &&
//           error.response.status &&
//           (error.response.status === 401 || error.response.status === 403)
//         ) {
//           console.log('Is refreshing: ', isRefreshing);
//           // Refresh token if not already refreshing
//           if (!isRefreshing) {
//             try {
//               // refresh token
//               // isRefreshing = true;
//               console.log('Refreshing in axios')
//               dispatch(setIsRefreshing(true))
//               newToken = await getNewAccessToken();
//               if (!newToken) {
//                 setErrorMessage('Not enough permissions');
//                 dispatch(clearToken());
//                 navigate('/login');
//               }
//               dispatch(setToken(newToken));
//               console.log('Token refreshed', token);
//               // Set new token in original request
//               const originalRequest = error.config;
//               originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
//
//               // Retry postponed requests
//               postponedRequests.forEach(({config, resolve, reject}) => {
//                 console.log('Retrying postponed request ', config.url);
//                 instance.request(config).then(resolve, reject);
//               });
//               postponedRequests.length = 0;
//
//               console.log('Retrying original request ', originalRequest.url)
//               return instance(originalRequest);
//             } catch (refreshError) {
//               console.log('Error refreshing token', error);
//               postponedRequests.length = 0;
//               navigate('/login');
//             } finally {
//               // isRefreshing = false;
//               dispatch(setIsRefreshing(false));
//             }
//           } else {
//             // If refreshing in process, postpone the request
//             if (error.config.url !== '/auth/refresh') {
//               console.log('Postponing request ', error.config.url)
//               const originalRequest = error.config;
//               return new Promise<void>((resolve, reject) => {
//                 postponedRequests.push({config: originalRequest, resolve, reject});
//               });
//             }
//           }
//         }
//
//         // 400 errors - display error message in UI
//         if (error.response && error.response.status === 400 && error.response.data.detail) {
//           setErrorMessage(error.response.data.detail);
//         }
//
//         // Other errors
//         if (error.code === "ECONNABORTED") {
//           setErrorMessage('Internal server error');
//         } else if (error.code === "ERR_CANCELED") { // Cancelled on unmount
//           console.log('Request cancelled on unmount.', error.message);
//         } else {
//           console.log('Some other error');
//           return Promise.reject(error);
//         }
//       });
//
//     return (
//       <AxiosContext.Provider value={instance}>
//         {children}
//       </AxiosContext.Provider>
//     )
//   }
//
// }
//
// export const getAxiosClient = () => {
//   return useContext(AxiosContext);
// };
//
// export default AxiosProvider;

export const getAxiosClient = () => {
  return axiosInstance;
}