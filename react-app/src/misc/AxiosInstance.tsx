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


export const getNewAccessToken = async () => {
  const response = await fetch(`https://${import.meta.env.VITE_REACT_APP_HOST}/auth/refresh`, {
    method: 'GET',
    credentials: 'include',
    timeout: 2000,
  });
  const data = await response.json();
  console.log('Refreshing token in ApolloWrapper', data.access_token)
  return data.access_token;
}


const AxiosContext = createContext<AxiosInstance>(
  axiosBase.create({
    baseURL: `https://${import.meta.env.VITE_REACT_APP_HOST}`,
  })
);

const AxiosProvider = ({children}) => {
  const {token} = useSelector((state) => state.auth);
  console.log('AxiosProvider');
  let isRefreshing = false;
  let newToken = null;
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
    console.log('request ' + config.url, config);
    // If newToken is available, but have not yet updated in the redux store, set it in the request explicitly
    if (newToken && config.headers.Authorization && !config.headers.Authorization.includes(newToken)) {
      config.headers['Authorization'] = `Bearer ${newToken}`;
    }
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
      console.log('Is refreshing: ', isRefreshing);
      // Refresh token if not already refreshing
      if (!isRefreshing) {
        try {
          // refresh token
          isRefreshing = true;
          console.log('Refreshing token, ', token)
          newToken = await getNewAccessToken();
          console.log('New token: ', newToken);
          if (!newToken) {
            setErrorMessage('Not enough permissions');
            navigate('/login');
          }
          dispatch(setToken(newToken));
          console.log('Token refreshed', token);
          // Set new token in original request
          const originalRequest = error.config;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      
          // Retry postponed requests
          postponedRequests.forEach(({config, resolve, reject}) => {
            console.log('Retrying postponed request ', config.url);
            instance.request(config).then(resolve, reject);
          });
          postponedRequests.length = 0;
          
          console.log('Retrying original request ', originalRequest.url)
          return instance(originalRequest);
        } catch (refreshError) {
          console.log('Error refreshing token', error);
          postponedRequests.length = 0;
          navigate('/login');
        } finally {
          isRefreshing = false;
        }
      }
    }
      // If refreshing in process, postpone the request
    if (isRefreshing) {
      if (error.config.url !== '/auth/refresh') {
        console.log('Postponing request ', error.config.url)
        const originalRequest = error.config;
        return new Promise<void>((resolve, reject) => {
          postponedRequests.push({config: originalRequest, resolve, reject});
        });
      }
    }
    
    // 400 errors
    if (error.response && error.response.status === 400 && error.response.data.detail) {
        setErrorMessage(error.response.data.detail);
    }
    
    // Other errors
    if (error.code === "ECONNABORTED") {
      setErrorMessage('Internal server error');
    } else if (error.code === "ERR_CANCELED") { // Cancelled on unmount
      console.log('Request cancelled on unmount.', error.message);
    } else {
      console.log('Some other error');
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