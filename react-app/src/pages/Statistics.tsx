import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StatisticsReport from "../components/PageStatistics/StatisticsReport";
import StatisticsChart from "../components/PageStatistics/StatisticsChart";
import {Button, Container, Grid, LinearProgress, Paper, Typography,} from "@mui/material";
import DatePicker from "../components/common/DatePicker";
import * as React from "react";
import {useRef, useState} from "react";
import {useQuery} from "@apollo/client";
import {GET_USERS_SHORT_BY_LANG, GET_USERS_SHORT_BY_TZ, GET_USERS_WITH_COORDINATES} from "../misc/gqlQueries";
import {Map, MarkerProps} from "../components/common/Map";
import {UserProps} from "../components/views/UserView";
import {useDispatch} from "react-redux";
import Table from "../components/common/Table";
import useOutsideClick from "../misc/hooks/OutsideClick";


interface timezoneUsers {
  timezone: string,
  users: UserProps[]
}


const Statistics = React.memo(() => {
  const dispatch = useDispatch();
  const today: Date = new Date();
  const todayString: string = today.toISOString().split("T")[0];
  const monthAgo: Date = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);
  const monthAgoString: string = monthAgo.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<Date>(monthAgo);
  const [endDate, setEndDate] = useState<Date>(today);
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useOutsideClick(ref, () => setCalendarVisible(false));
  
  // Set date range functions
  const halfYearRange = () => {
    const halfYearAgo: Date = new Date(today);
    halfYearAgo.setMonth(today.getMonth() - 6);
    setStartDate(halfYearAgo);
    setEndDate(today);
  }
  
  const yearRange = () => {
    const yearAgo: Date = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);
    setStartDate(yearAgo);
    setEndDate(today);
  }
  
  const allTimeRange = () => {
    const beginningOfTime: Date = new Date("2020-01-01");
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
  const usersByLanguage: { [key: string]: UserProps[] } = {
    en: [],
    ru: [],
    uk: [],
    fr: [],
    es: []
  }
  let langData: { id: number, value: number, label: string }[] = [
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
  
  const tableUsersByLanguage: { lang: string, usersCount: number }[] =
    usersByLanguage && Object.entries(usersByLanguage).map(([lang, users]) => {
      return {lang, usersCount: users.length}
    });
  
  // Users by timezone
  const {loading: timezoneLoading, error: timezoneError, data: timezoneData} = useQuery(GET_USERS_SHORT_BY_TZ);
  let usersByTimezone: timezoneUsers[] = [];
  if (timezoneData) {
    timezoneData.usersByTimezones.forEach((tzArr: timezoneUsers) => {
      usersByTimezone.push(tzArr);
    });
  }
  
  const tableUsersByTimezone: { timezone: string, usersCount: number }[] =
    usersByTimezone && usersByTimezone.map(({timezone, users}) => {
      return {timezone, usersCount: users.length}
    });
  
  
  return (
    <Container>
      
      <Paper
        ref={ref}
        elevation={5}
        square={false}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: calendarVisible ? 'flex' : 'none',
          zIndex: 1000,
        }}>
        <DatePicker date={startDate} setDate={setStartDate} secondDate={endDate} setSecondDate={setEndDate}/>
        <DatePicker date={endDate} setDate={setEndDate} secondDate={startDate} setSecondDate={setStartDate}/>
      </Paper>
      
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
        <Grid item container direction="column">
          <Grid item md={12} xl={4}>
            <Grid container direction={{xs: "row", md: "column"}}
                  justifyContent="center"
                  alignItems="center"
                  position={{md: "relative", xs: "static"}}
                  top="20%"
                  spacing={1}>
              <Grid item>
                <Button sx={{width: '165px'}} variant="contained" color="secondary" onClick={halfYearRange}>Last 6
                  months</Button>
              </Grid>
              <Grid item>
                <Button sx={{width: '165px'}} variant="contained" color="secondary" onClick={yearRange}>Last
                  year</Button>
              </Grid>
              <Grid item>
                <Button sx={{width: '165px'}} variant="contained" color="secondary" onClick={allTimeRange}>All
                  time</Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => setCalendarVisible(!calendarVisible)}
                  sx={{
                    width: '165px'
                  }}
                  disabled={calendarVisible}
                >Select Range</Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item md={12} xl={8}>
            <StatisticsChart startDate={startDate} endDate={endDate}/>
          </Grid>
        </Grid>
        <Grid alignItems="center" justifyContent="center">
          {mapLoading && <LinearProgress/>}
          {mapError && <Typography>Error: {mapError.message}</Typography>}
          {userMarkers.length > 0 && <Typography>Users with coordinates: {userMarkers.length}</Typography>}
          {mapData && <Map userMarkers={userMarkers}/>}
        </Grid>
        <Grid item xs={4} md={4} xl={3}>
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
              <Table rows={tableUsersByLanguage}/>}
          {/*// <Grid container spacing={2}>*/}
          {/*//  Object.entries(usersByLanguage).map(*/}
          {/*//     ([languageCode, users]) => (*/}
          {/*//     <Grid item key={languageCode}>*/}
          {/*//       <Typography variant="h6">{languageCode}</Typography>*/}
          {/*//       <Typography>{users.length}</Typography>*/}
          {/*//     </Grid>*/}
          {/*//   ))}*/}
          {/*// </Grid>*/}
        
        </Grid>
        <Grid item>
          {/*<Card>*/}
          {/*  <CardContent>*/}
          {/*    <CardHeader title="Users by timezone"/>*/}
          {/*    <Grid container spacing={2}>*/}
          {timezoneLoading && <LinearProgress/>}
          {timezoneError && <Typography>Error: {timezoneError.message}</Typography>}
          {timezoneData &&
              <Table rows={tableUsersByTimezone}/>
          }
          {/*      // {usersByTimezone.map(({timezone, users}) => (*/}
          {/*        <Grid item key={timezone}>*/}
          {/*           <Typography variant="h6">{timezone}</Typography>*/}
          {/*           <Typography onClick={(e) => {*/}
          {/*            dispatch(addWindow({*/}
          {/*              name: 'List', nestedContent: users.map((user: UserProps) => {*/}
          {/*                return {*/}
          {/*                  name: 'User',*/}
          {/*                  id: user.telegramId,*/}
          {/*                  shortViewData: user*/}
          {/*                }*/}
          {/*              }),*/}
          {/*              pos: {*/}
          {/*                x: e.clientX + window.scrollX,*/}
          {/*                y: e.clientY + window.scrollY*/}
          {/*              }*/}
          {/*            }))*/}
          {/*          }}>{users.length}</Typography>*/}
          {/*        </Grid>*/}
          {/*      ))}*/}
          {/*    </Grid>*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}
        </Grid>
      </Grid>
    </Container>
  )
    ;
});

export default Statistics;