import axiosBase, {AxiosInstance} from "axios";
import {createContext, useContext, useState} from "react";
import {useError} from './ErrorHandling';


const AxiosContext = createContext<AxiosInstance>(
  axiosBase.create({
    baseURL: `https://${import.meta.env.VITE_REACT_APP_HOST}`,
  })
);

const AxiosProvider = ({children}) => {
  const {setErrorMessage} = useError();
  const protocol = import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? 'https' : 'http';
  const instance = axiosBase.create({
    baseURL: `${protocol}://${import.meta.env.VITE_REACT_APP_HOST}`,
    timeout: 2000,
  });
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
    if (error.code === 401 || error.code === 403) {
      const parsedError = JSON.parse(error.response.data);
      setErrorMessage(parsedError.detail);
    }
  });

  return (
    <AxiosContext.Provider value={instance}>
      {children}
    </AxiosContext.Provider>
  )
}

export const getAxiosClient = () => {
  return useContext(AxiosContext);
};

export default AxiosProvider;