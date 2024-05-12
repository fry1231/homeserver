import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StatisticsReport from "../components/StatisticsReport";
import StatisticsChart from "../components/StatisticsChart";
import {Button, Card, CardContent, Container, Grid, Typography} from "@mui/material";
import DateRangePicker from "../components/DateRangePicker";
import {useState} from "react";


const Statistics = () => {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);
  const monthAgoString = monthAgo.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  
  const halfYearRange = () => {
    const halfYearAgo = new Date(today);
    halfYearAgo.setMonth(today.getMonth() - 6);
    setStartDate(halfYearAgo);
    setEndDate(today);
  }
  
  const yearRange = () => {
    const yearAgo = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);
    setStartDate(yearAgo);
    setEndDate(today);
  }
  
  const allTimeRange = () => {
    const beginningOfTime = new Date("2020-01-01");
    setStartDate(beginningOfTime);
    setEndDate(today);
  }
  
  return (
    <Container>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Accordion defaultExpanded>
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
          <Accordion style={{marginTop: '20px'}}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon/>}
              aria-controls="panel2a-content"
              id="panel2a-header"
            >
              <Typography variant="h5">Month</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <StatisticsReport afterDate={monthAgoString} beforeDate={todayString}/>
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Grid container direction="row">
                <Grid item>
                  {/*<Grid container direction="column" alignItems="center" justifyContent="space-between">*/}
                    <Button sx={{mr: 2}} variant="contained" color="secondary" onClick={halfYearRange}>Last 6 months</Button>
                    <Button mr={2} variant="contained" color="secondary" onClick={yearRange}>Last year</Button>
                    <Button mr={2} variant="contained" color="secondary" onClick={allTimeRange}>All time</Button>
                  {/*</Grid>*/}
                </Grid>
                <Grid item>
                  <DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate}
                                   setEndDate={setEndDate}/>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <StatisticsChart startDate={startDate} endDate={endDate}/>
        </Grid>
      </Grid>
    </Container>
  );
  
  
};

export default Statistics;