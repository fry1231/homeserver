import {useRef, useState} from "react";
import {Box, Button, Grid, Paper} from "@mui/material";
import FarmChart from "../components/PageFarm/FarmChart";
import DateRangePicker from "../components/common/DateRangePicker";
import IrrigationTimer from "../components/PageFarm/IrrigationTimer";
import useOutsideClick from "../misc/hooks/OutsideClick";


export default function Farm() {
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useOutsideClick(ref, () => setCalendarVisible(false));
  
  const today = new Date();
  today.setHours(23, 59, 59, 999)
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const [startDate, setStartDate] = useState<Date>(yesterday);
  const [endDate, setEndDate] = useState<Date>(today);
  
  return (
    <>
      <Paper
        ref={ref}
        elevation={5}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: calendarVisible ? 'flex' : 'none',
          zIndex: 1000,
        }}>
        <DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate}/>
      </Paper>
      
      <Grid container direction="column" alignItems="center" justifyContent="center">
        <Grid item>
          <Grid container direction="row" alignItems="center" flexWrap="nowrap">
            <Grid item>
              <FarmChart startDate={startDate} endDate={endDate}/>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={() => setCalendarVisible(!calendarVisible)}
                sx={{
                  transform: 'rotate(-90deg)',
                  position: 'relative',
                  right: '80px',
                  whiteSpace: 'nowrap',
                }}
                disabled={calendarVisible}
              >Select Day Range</Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={4}>
          <IrrigationTimer/>
        </Grid>
      </Grid>
    </>
  );
};
