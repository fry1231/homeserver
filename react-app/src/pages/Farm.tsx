import {getAxiosClient} from "../misc/AxiosInstance";
import {useEffect, useState} from "react";
import {Button, Grid} from "@mui/material";
import FarmChart from "../components/FarmChart";
import DateRangePicker from "../components/DateRangePicker";


export default function Farm() {
  const [wateringNeeded, setWateringNeeded] = useState(false);
  // const [selectedDateRange, setSelectedDateRange] = useState([new Date(), new Date()]);
  const today = new Date();
  today.setHours(23, 59, 59, 999)
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(today);
  const axios = getAxiosClient();
  const requestWatering = () => {
    axios.post(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/set-needed`, null)
      .then(r => {
        if (r.status === 202 || r.status === 208) {
          setWateringNeeded(true);
        }
      });
  }
  
  // useEffect(() => {
  //   // Get current watering status every minute
  //   const getWateringStatus = setInterval(function _() {
  //     axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/is-needed?noreset=true`, {
  //       signal: timeoutAbortSignal(5000)
  //     })
  //     .then(r => {
  //       if (r.data === '1') {
  //         setWateringNeeded(true);
  //       } else if (r.data === '0') {
  //         setWateringNeeded(false);
  //       } else {
  //         alert('Error getting watering status');
  //       }
  //     })
  //     return _;
  //   }(), 1000 * 60);
  //   return () => clearInterval(getWateringStatus);
  // }, []);
  
  
  return (
    <Grid container direction="column" alignItems="center" spacing={3}>
      <Grid item>
        <DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate}/>
      </Grid>
      <Grid item>
        <FarmChart startDate={startDate} endDate={endDate}/>
      </Grid>
      <Grid item>
        <Button
          onClick={requestWatering}
          variant="contained"
          color={wateringNeeded ? 'error' : 'success'}
          disabled={wateringNeeded}
        >
          Request Watering
        </Button>
      </Grid>
    </Grid>
  );
};
