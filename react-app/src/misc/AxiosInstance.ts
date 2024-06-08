import axiosBase from "axios";
import {useError} from './ErrorHandling';


// const {setErrorMessage} = useError();
//
const protocol = import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? 'https' : 'http';
const instance = axiosBase.create({
  baseURL: `${protocol}://${import.meta.env.VITE_REACT_APP_HOST}`,
  timeout: 2000,
});

// Add a request interceptor
instance.interceptors.request.use(function (config) {
  // Do something before request is sent
  console.log('request', config)
  return config;
}, function (error) {
  // Do something with request error
  console.log('error request', error);
  return Promise.reject(error);
});

// Add a response interceptor
instance.interceptors.response.use(function (response) {
  console.log('response', response)
  return response;
}, function (error) {
  console.log('error response', error);
  return Promise.reject(error);
});

export default instance;



