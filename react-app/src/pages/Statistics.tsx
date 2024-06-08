import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StatisticsReport from "../components/StatisticsReport";
import StatisticsChart from "../components/StatisticsChart";
import {Button, Card, CardContent, CardHeader, Container, Grid, LinearProgress, Typography} from "@mui/material";
import DateRangePicker from "../components/DateRangePicker";
import DatePicker from "../components/DatePicker";
import {useState} from "react";
import {useQuery} from "@apollo/client";
import {GET_USERS_SHORT_BY_LANG, GET_USERS_SHORT_BY_TZ, GET_USERS_WITH_COORDINATES} from "../misc/gqlQueries";
import {MarkerProps, Map} from "../components/Map";
import {UserProps} from "../components/views/UserView";
import {useDispatch} from "react-redux";
import {addWindow} from "../reducers/draggables";
import {PieChart} from '@mui/x-charts';


interface timezoneUsers {
  timezone: string,
  users: UserProps[]
}


const Statistics = () => {
  const dispatch = useDispatch();
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
  
  // Get all users with notnull coordinates
  const {loading: mapLoading, error: mapError, data: mapData} = useQuery(GET_USERS_WITH_COORDINATES);
  const userMarkers: MarkerProps[] = [];
  if (mapData) {
    mapData.users.forEach((user: any) => {
      let displayName = ''
      if (user.firstName) {
        displayName += user.firstName + ' '
      }
      if (user.lastName) {
        displayName += user.lastName + ' '
      }
      if (user.userName) {
        displayName += `(@${user.userName})`
      }
      userMarkers.push({
        coords: [user.latitude, user.longitude],
        userName: displayName,
        telegramId: user.telegramId
      });
    });
  }
  
  // Users by language
  const usersByLanguage = {
    en: [],
    ru: [],
    uk: [],
    fr: [],
    es: []
  }
  let langData = [
    {id: 0, value: 0, label: 'en'},
    {id: 1, value: 0, label: 'ru'},
    {id: 2, value: 0, label: 'uk'},
    {id: 3, value: 0, label: 'fr'},
    {id: 4, value: 0, label: 'es'},
  ];

  let languageDataLoaded = false;
  Object.entries(usersByLanguage).forEach(([languageCode, arr]) => {
    const {loading, error, data} = useQuery(GET_USERS_SHORT_BY_LANG, {
      variables: {
        language: languageCode
      }
    });
    if (data) {
      usersByLanguage[languageCode] = data.users;
      langData.forEach((lang) => {
        if (lang.label === languageCode) {
          lang.value = data.users.length;
        }
      });
      languageDataLoaded = true;
    }
  });
  
  // Users by timezone
  const {loading: timezoneLoading, error: timezoneError, data: timezoneData} = useQuery(GET_USERS_SHORT_BY_TZ);
  let usersByTimezone: timezoneUsers[] = [];
  if (timezoneData) {
    timezoneData.usersByTimezones.forEach((tzArr: timezoneUsers) => {
      usersByTimezone.push(tzArr);
    });
  }
  
  return (
    <Container>
      <Grid container spacing={3} justifyContent="center">
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
        <Grid item >
          <Grid container direction="row" justifyContent="center">
            <Button sx={{mr: 2}} variant="contained" color="secondary" onClick={halfYearRange}>Last 6 months</Button>
            <Button sx={{mr: 2}} variant="contained" color="secondary" onClick={yearRange}>Last year</Button>
            <Button sx={{mr: 2}} variant="contained" color="secondary" onClick={allTimeRange}>All time</Button>
          </Grid>
          <Grid item>
            <DatePicker date={startDate} setDate={setStartDate} secondDate={endDate} setSecondDate={setEndDate}/>
            <DatePicker date={endDate} setDate={setEndDate} secondDate={startDate} setSecondDate={setStartDate}/>
          </Grid>
        </Grid>
        <StatisticsChart startDate={startDate} endDate={endDate}/>
        <Grid alignItems="center" justifyContent="center">
        {mapLoading && <LinearProgress />}
        {mapError && <Typography>Error: {mapError.message}</Typography>}
        {userMarkers.length > 0 && <Typography>Users with coordinates: {userMarkers.length}</Typography>}
        {mapData && <Map userMarkers={userMarkers}/>}
        </Grid>
        <Grid item>
          {/*<Card>*/}
          {/*  <CardContent>*/}
          {/*    <CardHeader title="Users by language"/>*/}
          {/*    <Grid container spacing={2}>*/}
          {/*      {Object.entries(usersByLanguage).map(([languageCode, users]) => (*/}
          {/*        <Grid item key={languageCode}>*/}
          {/*          <Typography variant="h6">{languageCode}</Typography>*/}
          {/*          <Typography>{users.length}</Typography>*/}
          {/*        </Grid>*/}
          {/*      ))}*/}
          {/*    </Grid>*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}
          {languageDataLoaded &&
              <Grid container spacing={2}>
                {Object.entries(usersByLanguage).map(([languageCode, users]) => (
                  <Grid item key={languageCode}>
                    <Typography variant="h6">{languageCode}</Typography>
                    <Typography>{users.length}</Typography>
                  </Grid>
                ))}
              </Grid>
          }
        </Grid>
        <Grid item>
          <Card>
            <CardContent>
              <CardHeader title="Users by timezone"/>
              <Grid container spacing={2}>
                {timezoneLoading && <LinearProgress />}
                {timezoneError && <Typography>Error: {timezoneError.message}</Typography>}
                {usersByTimezone.map(({timezone, users}) => (
                  <Grid item key={timezone}>
                    <Typography variant="h6">{timezone}</Typography>
                    <Typography onClick={(e) => {
                      dispatch(addWindow({name: 'List', nestedContent: users.map((user: UserProps) => {
                        return {
                          name: 'User',
                          id: user.telegramId,
                          shortViewData: user
                        }
                      }),
                        pos: {
                          x: e.clientX + window.scrollX,
                          y: e.clientY + window.scrollY
                        }
                      }))
                    }}>{users.length}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Statistics;