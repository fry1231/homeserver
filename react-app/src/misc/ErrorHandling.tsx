import {Alert, Typography} from "@mui/material";
import {useSelector, useDispatch} from "react-redux";
import {clearErrorMessage} from "../reducers/errors";
import {useEffect, useState} from "react";


export const ErrorWrapper = ({children}) => {
  const {errorMessage, incr} = useSelector((state) => state.errors);
  const dispatch = useDispatch();
  const [timer, setTimer] = useState<NodeJS.Timeout | string | number | undefined>();
  useEffect(() => {
    if (errorMessage) {
      const newTimer = setTimeout(() => {
        dispatch(clearErrorMessage());
      }, 5000);
      clearTimeout(timer);
      setTimer(newTimer);
      return () => clearTimeout(timer);
    }
  }, [incr]);
  return (
    <>
      {errorMessage && (
        <Alert severity="error" onClose={() => dispatch(clearErrorMessage())}>
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
    </>
  );
};
