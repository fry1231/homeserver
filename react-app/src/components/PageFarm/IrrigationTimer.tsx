import {SyntheticEvent, useEffect, useState} from 'react';
import {TextField, Button, Grid, Typography, Container, Box, Snackbar} from '@mui/material';
import axios from '../../misc/AxiosInstance';
import {useDispatch} from "react-redux";
import {setErrorMessage, setWarningMessage} from "../../reducers/errors";


const IrrigationTimer = () => {
  const dispatch = useDispatch();
  const [seconds, setSeconds] = useState<string>('');
  const [currentTimer, setCurrentTimer] = useState<string>('');
  const [openTimerIsSet, setOpenTimerIsSet] = useState<boolean>(false);
  const handleClose = (event: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenTimerIsSet(false);
  };
  
  const getCurrentTimer = () => {
    axios.get('/farm/watering/seconds?noreset=true')
      .then((response) => {
        console.log('Got current timer');
        setCurrentTimer(response.data);
      })
      .catch((error) => {
        dispatch(setErrorMessage('Error getting current timer'));
        console.error(error);
      });
  }
  
  const handleButtonClick = (value: number) => {
    setSeconds(value.toString());
  };
  
  const handleInputChange = (event) => {
    setSeconds(event.target.value);
  };
  
  const handleSubmit = () => {
    const secondsInt: number = parseInt(seconds);
    if (isNaN(secondsInt) || seconds < 0) {
      dispatch(setErrorMessage('Invalid input'));
    }
    axios.post(`/farm/watering/set-seconds?seconds=${secondsInt}`)
      .then((response) => {
        if (response.status === 202) {
          setOpenTimerIsSet(true);
        } else if (response.status === 208) {
          dispatch(setWarningMessage('Timer set, but the previous timer was not finished'));
        }
        setSeconds('');
      })
      // .catch((error) => {
      //   dispatch(setErrorMessage('Error setting timer'));
      //   console.error(error);
      // })
      .finally(() => {
        getCurrentTimer();
      });
  };
  
  useEffect(() => {
    getCurrentTimer();
    const interval = setInterval(() => {
      getCurrentTimer();
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item xs={10}>
          <TextField
            fullWidth
            label="Enter seconds"
            variant="outlined"
            value={seconds}
            onChange={handleInputChange}
            type="number"
          />
        </Grid>
        <Grid item xs={10}>
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            {[5, 10, 15, 20].map((value: number, index: number) => (
              <Grid item xs={6} sm={6} key={index}>
                <Button variant="outlined"
                        color="secondary"
                        sx={{width: '100%'}}
                        onClick={() => handleButtonClick(value)}>
                  {value} seconds
                </Button>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={10}>
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={6}>
              <Typography variant="h6" style={{textAlign: "center"}}>Current Timer: {currentTimer}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                {...(seconds === '' ? {disabled: true} : {})}
              >
                Set Timer
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Snackbar
        open={openTimerIsSet}
        autoHideDuration={3000}
        message={"Timer set"}
        onClose={handleClose}
      />
    </>
  );
};

export default IrrigationTimer;