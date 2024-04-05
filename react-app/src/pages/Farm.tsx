import axios from "axios";
import {timeoutAbortSignal} from "../misc/utils";
import {useEffect, useState} from "react";
import {Button} from "@mui/material";
import FarmChart from "../components/FarmChart";
import DateRangePicker from "../components/DateRangePicker";


export default function Farm() {
  const [wateringNeeded, setWateringNeeded] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([new Date(), new Date()]);
  
  const requestWatering = () => {
    axios.post(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/set-needed`, null, {
      signal: timeoutAbortSignal(5000)
    })
      .then(r => {
        if (r.status === 202 || r.status === 208) {
          setWateringNeeded(true);
        }
      });
  }
  
  useEffect(() => {
    // Get current watering status every minute
    const getWateringStatus = setInterval(function _() {
      axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/is-needed?noreset=true`, {
        signal: timeoutAbortSignal(5000)
      })
      .then(r => {
        if (r.data === '1') {
          setWateringNeeded(true);
        } else if (r.data === '0') {
          setWateringNeeded(false);
        } else {
          alert('Error getting watering status');
        }
      })
      return _;
    }(), 1000 * 60);
    return () => clearInterval(getWateringStatus);
  }, []);
  
  
  return (
    <>
      <DateRangePicker onChange={setSelectedDateRange}/>
      <FarmChart selectedDateRange={selectedDateRange} />
      <Button onClick={requestWatering}
              variant="contained"
              color={wateringNeeded ? 'error' : 'success'}
              disabled={wateringNeeded}>Request watering</Button>
    </>
  );
};
