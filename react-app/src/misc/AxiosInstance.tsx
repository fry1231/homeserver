import axiosBase, {AxiosInstance, AxiosRequestConfig} from "axios";
import {createContext, useContext, useEffect} from "react";
import {setToken} from "../reducers/auth";
import {setErrorMessage as setErrorMessage_} from "../reducers/errors";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";


interface RetryQueueItem {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
  config: AxiosRequestConfig;
}

const refreshAccessToken = async (instance: AxiosInstance) => {
  try {
    const response = await instance.get('/auth/refresh', {withCredentials: true});
    return response.data;
  }
  catch (error) {
    return Promise.reject(error);
  }
}


const AxiosContext = createContext<AxiosInstance>(
  axiosBase.create({
    baseURL: `https://${import.meta.env.VITE_REACT_APP_HOST}`,
  })
);

const AxiosProvider = ({children}) => {
  const {token} = useSelector((state) => state.auth);
  let isRefreshing: boolean = false;
  const postponedRequests: RetryQueueItem[] = [];
  const dispatch = useDispatch();
  const setErrorMessage = (message: string) => dispatch(setErrorMessage_(message));
  const navigate = useNavigate();
  
  // Create axios instance
  const protocol = import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? 'https' : 'http';
  const instance = axiosBase.create({
    baseURL: `${protocol}://${import.meta.env.VITE_REACT_APP_HOST}`,
    timeout: 2000,
  });
  
  // Add default auth header on token change
  useEffect(() => {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [token]);
  
  instance.interceptors.request.use( (config) => {
    console.log('request' + config.url, config);
    return config;
  }, (error) => {
    console.error('error request', error);
  });
  
  instance.interceptors.response.use( (response) => response,
    async (error) => {
    if (
      error.response &&
      error.response.status &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.log('Authorization error, trying to refresh token');
      // Refresh token if not already refreshing
      if (!isRefreshing) {
        try {
          isRefreshing = true;
          
          // refresh token
          const newToken = await refreshAccessToken(instance);
          dispatch(setToken(newToken));
          
          // Set new token in original request
          const originalRequest = error.config;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Retry postponed requests
          postponedRequests.forEach(({config, resolve, reject}) => {
            instance.request(config).then(resolve, reject);
          });
          postponedRequests.length = 0;
          
          // Retry the original request
          return instance(originalRequest);
        }
        catch (refreshError) {
          console.log('Error refreshing token', error);
          navigate('/login');
        }
        finally {
          isRefreshing = false;
        }
      }
      
      // If refreshing in process, postpone the request
      if (isRefreshing) {
        console.log('Postponing request ', error.config.url)
        const originalRequest = error.config;
        const url = originalRequest.url;
        
        // If /auth/refresh in url, then something is wrong, navigate to login
        if (url.includes('/auth/refresh')) {
          // Clear callStack
          postponedRequests.length = 0;
          navigate('/login');
        } else {
          return new Promise<void>((resolve, reject) => {
            postponedRequests.push({config: originalRequest, resolve, reject});
          });
        }
      }
      
    // Other errors
    } else if (error.code === "ECONNABORTED") {
      setErrorMessage('Internal server error');
    } else if (error.code === "ERR_CANCELED") { // Cancelled on unmount
      console.log('Request cancelled: ', error.message);
    } else {
      return Promise.reject(error);
    }
    
  });

  return (
    <AxiosContext.Provider value={instance}>
      {children}
    </AxiosContext.Provider>
  )
}

export const getAxiosClient = () => {
  const {token} = useSelector((state) => state.auth);
  const instance = useContext(AxiosContext);
  instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return instance;
};

export default AxiosProvider;