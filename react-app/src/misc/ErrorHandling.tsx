import {createContext, useState, useContext, useEffect} from 'react';
import {Alert, Typography} from "@mui/material";


const ErrorContext = createContext({
  errorMessage: '',
  setErrorMessage: (value) => {
  },
});

export const useError = () => {
  const context = useContext(ErrorContext);
  const {errorMessage, setErrorMessage} = context;
  
  useEffect(() => {
    errorMessage && setTimeout(() => setErrorMessage(''), 5000);
  }, [errorMessage, setErrorMessage]);
  
  return context;
};

export const ErrorProvider = ({children}) => {
  const [errorMessage, setErrorMessage] = useState('');
  
  return (
    <ErrorContext.Provider value={{errorMessage, setErrorMessage}}>
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {
            errorMessage.split('\n')
                        .map(
                          (line: string, i: number) =>
                          <Typography key={i}>{line}</Typography>
                        )
          }
        </Alert>
      )}
      {children}
    </ErrorContext.Provider>
  );
};
