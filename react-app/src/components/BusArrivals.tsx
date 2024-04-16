import {Box, Button, Stack, Switch, Typography, useTheme} from "@mui/material";
import {tokens} from "../theme.ts";
import {useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {busDataUpdated, speedUpRefresh} from "../reducers/buses";
import axios from "axios";
import {useAuth} from "../misc/authProvider.jsx";


interface BusResponse {
  busData: Destination[];
}

interface Destination {
  destinationName: string;
  buses: BusArrival[];
}

interface BusArrival {
  busNum: number;
  eta: string;
  destination: string;
  secondsToBus?: number;
}


export default function BusArrivals() {
  const {token, setToken} = useAuth();
  const dispatch = useDispatch();
  const state = useSelector((state) => state.buses);
  const busData = state.busData;
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  const [limitReached, setLimitReached] = useState(false);
  
  useEffect(() => {
    let previousBytes = 0;
    axios.get(
      `/buses/arrivals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'stream',
        cancelToken: source.token,
        onDownloadProgress: (progressEvent) => {
          const newBytes = progressEvent.loaded - previousBytes;
          previousBytes = progressEvent.loaded;
          // Access the new chunk of data
          const newChunk = progressEvent.event.currentTarget.response.slice(-newBytes);
          const data: BusResponse = JSON.parse(
            newChunk
            );
          console.log(data);
          const busData = data.busData;
          busData.map((destination) => {
            destination.buses.map((bus) => {
              bus.secondsToBus = Math.floor((new Date(bus.eta).getTime() - Date.now()) / 1000);
            });
          });
          dispatch(busDataUpdated(busData));
          if (progressEvent.loaded > 1000 * 1000) {
            source.cancel("Request cancelled on limit reached");
            setLimitReached(true);
          }
        }
      })
      .then((response) => {
        console.log('Finished fetching bus data');
      })
      .catch((error) => {
        console.error(error);
        source.cancel("Request cancelled on error");
      });

    // Update time to bus every second
    const timerId = setInterval(() => {
      if (busData) {
        Array.from(document.getElementsByClassName("timeToBus")).forEach((element) => {
          const backupTime = new Date(element.previousElementSibling.getAttribute("backuptime"));
          const secondsToBus = Math.floor((backupTime.getTime() - Date.now()) / 1000);
          const minutes = Math.floor(secondsToBus / 60);
          const seconds = secondsToBus % 60;
          element.innerHTML = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        })
      }
    }, 1000);
    // Clean up EventSource on component unmount
    return () => {
      source.cancel("Request cancelled on unmount");
      clearInterval(timerId);
    };
  }, [limitReached]);

  return (
    <>
      <Box display="flex" justifyContent="right" mx={4}>
        <Stack direction="column" alignItems="center">
          <Typography>Refresh Rate</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>Low</Typography>
            <Switch
              checked={state.fastRefresh}
              inputProps={{'aria-label': 'controlled'}}
              onChange={() => {
                dispatch(speedUpRefresh(!state.fastRefresh));
              }}
              label="Fast Update"
              color="warning"/>
            <Typography>High</Typography>
          </Stack>
        </Stack>
      </Box>
      <Box display="flex" flexDirection="column" m={4}>
        {busData.map((destination, index) => {
          return (
            <Box key={index} display="flex" flexDirection="column">
              <Typography variant="h6" color="textPrimary">
                {destination.destinationName}
              </Typography>
              {destination.buses.map((bus, index) => {
                return (
                  <BusRow key={index} busNum={bus.busNum} eta={bus.eta} destination={bus.destination}
                          secondsToBus={bus.secondsToBus}/>
                );
              })}
              <p></p>
            </Box>
          );
        })}
      </Box>
    </>
  );
}


const BusRow = (props: BusArrival) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const minutes = Math.floor(props.secondsToBus / 60);
  const seconds = props.secondsToBus % 60;
  const timeToBus = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  let busColor;
  if (props.busNum == 258) {
        busColor = colors.redAccent[400];
  }
    else if (props.busNum == 259) {
        busColor = colors.blueAccent[500]
  }
    else {
        busColor = "gray";
  }

    return (
  <Box display="flex" justifyContent="space-between">
    {/*Bus number and destination*/}
      <Box display="flex" justifyContent="left">
        <Box
          justifyContent="center"
          alignItems="center"
          bgcolor={busColor}
          color="black"
          borderRadius="20%"
          width="40px"
          height="25px"
          textAlign="center"
          fontSize="16px">
          <b>{props.busNum}</b>
        </Box>
        {/*<Typography sx={{*/}
        {/*  fontFamily: "Arial",*/}
        {/*  width: "20px",*/}
        {/*  padding: "3px 14px",*/}
        {/*  backgroundColor: busColor,*/}
        {/*  fontSize: "16px",*/}
        {/*  color: "black",*/}
        {/*  marginTop: "4px",*/}
        {/*  marginBottom: "4px"}}*/}
        {/*>*/}
        {/*  <b>{props.busNum}</b>*/}
        {/*</Typography>*/}
        <Typography sx={{
          fontFamily: "Arial",
          fontSize: "12px",
          color: colors.grey[100],
          padding: "3px 14px",
          marginTop: "4px",
          marginBottom: "4px"
        }}>
          {props.destination}
        </Typography>
      </Box>

    {/*Time to bus and ETA*/}
      <Box display="flex" justifyContent="right">
        <p backuptime={new Date(props.eta).toISOString()} style={{
            fontFamily: "Arial",
            fontSize: "20px",
            color: colors.grey[100],
            padding: "3px 14px",
            marginTop: "4px",
            marginBottom: "4px"
        }}>
          {new Date(props.eta).toLocaleTimeString("ru-RU")}
        </p>
        <p className={"timeToBus"} style={{
          fontFamily: "Arial",
          fontSize: "20px",
          color: colors.grey[100],
          padding: "3px 14px",
          marginTop: "4px",
          marginBottom: "4px"
        }}>
          {/*time to bus in 00:00 format*/}
          {timeToBus}
        </p>
      </Box>
    </Box>
    );
};