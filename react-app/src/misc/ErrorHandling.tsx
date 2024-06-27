import {Alert, Typography} from "@mui/material";
import {useSelector, useDispatch} from "react-redux";
import {clearAllMessages, ErrorsState} from "../reducers/errors";
import {useEffect, useState} from "react";


export const ErrorWrapper = ({children}) => {
  const {errorMessage, warningMessage, successMessage, incr} = useSelector((state) => state.errors as ErrorsState);
  const dispatch = useDispatch();
  const [timer, setTimer] = useState<NodeJS.Timeout | string | number | undefined>();
  useEffect(() => {
    if (errorMessage || warningMessage || successMessage) {
      const newTimer = setTimeout(() => {
        dispatch(clearAllMessages());
      }, 3000);
      clearTimeout(timer);
      setTimer(newTimer);
      return () => clearTimeout(timer);
    }
  }, [incr]);
  return (
    <>
      <div style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000}}>
        {successMessage && (
          <Alert severity="success" onClose={() => dispatch(clearAllMessages())}>
            {
              successMessage.split('\n')
              .map(
                (line: string, i: number) =>
                  <Typography key={i}>{line}</Typography>
              )
            }
          </Alert>
        )}
        {warningMessage && (
          <Alert severity="warning" onClose={() => dispatch(clearAllMessages())}>
            {
              warningMessage.split('\n')
              .map(
                (line: string, i: number) =>
                  <Typography key={i}>{line}</Typography>
              )
            }
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" onClose={() => dispatch(clearAllMessages())}>
            {
              errorMessage.split('\n')
              .map(
                (line: string, i: number) =>
                  <Typography key={i}>{line}</Typography>
              )
            }
          </Alert>
        )}
      </div>
      
      {children}
      
    </>
  );
};