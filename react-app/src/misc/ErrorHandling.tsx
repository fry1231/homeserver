import {createContext, useState, useContext, useEffect} from 'react';
import {Alert} from "@mui/material";

const ErrorContext = createContext({
  errorMessage: '',
  setErrorMessage: () => {
  },
});

export const useError = () => useContext(ErrorContext);

export const ErrorProvider = ({children}) => {
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    errorMessage && setTimeout(() => setErrorMessage(''), 5000);
  }, [errorMessage]);
  return (
    <ErrorContext.Provider value={{errorMessage, setErrorMessage}}>
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}
      {children}
    </ErrorContext.Provider>
  );
};
