import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {StatisticsReport} from "../components/StatisticsReport";
import StatisticsChart from "../components/StatisticsChart";
import {Typography} from "@mui/material";

const Statistics = () => {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);
  const monthAgoString = monthAgo.toISOString().split("T")[0];
  
  return (
    <>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon/>}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="h5">Today</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <StatisticsReport afterDate={todayString} beforeDate={todayString}/>
        </AccordionDetails>
      </Accordion>
      <StatisticsChart/>
    </>
  );
};

export default Statistics;