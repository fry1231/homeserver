import {Typography} from "@mui/material";
import {StatisticsReport} from "../components/StatisticsReport";

const Statistics = () => {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  return (
    <>
      <Typography variant="h3">Today</Typography>
      <StatisticsReport afterDate={todayString} beforeDate={todayString}/>
      <Typography variant="h3">This month</Typography>
      <Typography variant="h3">From the beginning</Typography>
    </>
  );
};

export default Statistics;