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

const refreshAccessToken = async (instance: AxiosInstance, dispatch: any) => {
  try {
    const response = await instance.get('/auth/refresh', {
      withCredentials: true,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000'
      }
    });
    dispatch(setToken(response.data.access_token));
    return response.data.access_token;
  } catch (error) {
    throw error;
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
  const callStack = {};
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
  
  // instance.defaults.headers.common["Access-Control-Allow-Origin"] = "http://localhost:3000";
  instance.interceptors.request.use(function (config) {
    console.log('request', config);
    return config;
  }, function (error) {
    console.error('error request', error);
  });
  
  instance.interceptors.response.use(function (response) {
    return response;
  }, function (error) {
    console.log('error response', error);
    if (
      error.response &&
      error.response.status &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.log('Authorization error, trying to refresh token');
      // Refresh token if not already refreshing
      if (!isRefreshing) {
        isRefreshing = true;
        instance.get('/auth/refresh', {
          withCredentials: true,
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000'
          }
        })
        .then((response) => {
          dispatch(setToken(response.data.access_token));
          console.log('Token refreshed:', response.data.access_token);
          // Retry the postponed requests
          Object.values(callStack).flat().forEach((reqConfig) => {
            console.log('Retrying postponed request', reqConfig.url);
            instance.request(reqConfig);
          })
          isRefreshing = false;
        })
        .catch((error) => {
          console.log('Error refreshing token', error);
          navigate('/login');
        });
      }
      // If refreshing in process, postpone the request
      if (isRefreshing) {
        console.log('Postponing request ', error.config.url)
        const originalRequest = error.config;
        const url = originalRequest.url;
        // If /auth/refresh in url, then something is wrong, navigate to login
        if (url.includes('/auth/refresh')) {
          // Clear callStack
          for (const prop of Object.getOwnPropertyNames(callStack)) {
            delete callStack[prop];
          }
          navigate('/login');
        } else {
          callStack[url] = []  //  Save only the last request for the URL             callStack[url] || [];
          callStack[url].push(originalRequest);
        }
      }
      
    } else if (error.code === "ECONNABORTED") {
      setErrorMessage('Internal server error');
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