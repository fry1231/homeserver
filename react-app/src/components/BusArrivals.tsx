import {Box, Button, Grid, Stack, Switch, Typography, useTheme} from "@mui/material";
import {tokens} from "../theme.ts";
import {useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {busDataUpdated, speedUpRefresh} from "../reducers/buses";
// import axios from "../misc/AxiosInstance";
import axiosClass from "axios";
import {useAuth} from "../misc/authProvider";


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

/** Calculate time to bus
 * @param eta - ISOstring with time of bus arrival
 * @returns string with time to bus in 00:00 format
**/
const timeToBus = (eta: string) => {
  const secondsToBus = Math.floor((new Date(eta).getTime() - Date.now()) / 1000);
  const minutes = Math.floor(secondsToBus / 60);
  const seconds = secondsToBus % 60;
  return minutes < 0 || seconds < 0
    ? 'Missed'
    : `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function BusArrivals() {
  const {token, axiosClient} = useAuth();
  const dispatch = useDispatch();
  const state = useSelector((state) => state.buses);
  const busData = state.busData;
  const CancelToken = axiosClass.CancelToken;
  const source = CancelToken.source();
  const [limitReached, setLimitReached] = useState(false);
  
  useEffect(() => {
    console.log("Fetching bus data");
    let previousBytes = 0;
    axiosClient && axiosClient.get(
      `/buses/arrivals`, {
        responseType: 'stream',
        cancelToken: source.token,
        timeout: 0,
        // Update bus data on each chunk of data received
        onDownloadProgress: (progressEvent) => {
          const newBytes = progressEvent.loaded - previousBytes;
          previousBytes = progressEvent.loaded;
          // Access the new chunk of data
          const newChunk = progressEvent.event.currentTarget.response.slice(-newBytes);
          console.log(newChunk);
          const data: BusResponse = JSON.parse(
            newChunk
            );
          const busData = data.busData;
          // Calculate time to bus for each bus, modify inplace
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
          element.innerHTML = timeToBus(backupTime.toISOString());
        })
      }
    }, 1000);
    // Clean up EventSource on component unmount
    return () => {
      source.cancel("Request cancelled on unmount");
      clearInterval(timerId);
    };
  }, [limitReached]);
  
  console.log(busData)
  
  return (
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
  );
}


const BusRow = (props: BusArrival) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const minutes = Math.floor(props.secondsToBus / 60);
  const seconds = props.secondsToBus % 60;

  const timeToBus = minutes < 0 || seconds < 0
    ? 'Missed'
    : `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

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
      <Box display="flex" justifyContent="left" alignItems="center">
        <Box
          justifyContent="center"
          alignItems="center"
          bgcolor={busColor}
          color="black"
          borderRadius="30%"
          width="40px"
          height="20px"
          textAlign="center"
          fontSize="13px">
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
            fontSize: "13px",
            color: colors.grey[100],
            padding: "3px 14px",
            marginTop: "4px",
            marginBottom: "4px"
        }}>
          {new Date(props.eta).toLocaleTimeString("ru-RU")}
        </p>
        <p className={"timeToBus"} style={{
          fontFamily: "Arial",
          fontSize: "13px",
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