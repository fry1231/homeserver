import {Box, Grid, Paper, Radio, Typography} from "@mui/material";
import {useEffect, useState, useRef, createRef } from "react";
import {useDispatch, useSelector} from "react-redux";
import {logsRefreshed, logUpdateRecieved, clearLogs} from "../reducers/logs";
import {useAuth} from "../misc/authProvider.jsx";
import {tokens} from "../theme";
import {useTheme} from "@mui/material/styles";

// Parse date in 30.04.2024_19:04:56 format to Date object in local time
const localizedTime = (timeString: string) => {
  const [datePart, timePart] = timeString.split('_');
  const [day, month, year] = datePart.split('.');
  const [hours, minutes, seconds] = timePart.split(':');
  const normalizedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  const parsedDate = new Date(normalizedDate);
  return parsedDate.toLocaleString();
}

export default function Logs() {
  const dispatch = useDispatch();
  const stateLocal = useSelector((state) => state.logs);
  let protocol: string;
  import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? protocol = "wss" : protocol = "ws";
  
  const clientRef = useRef(null);
  const [waitingToReconnect, setWaitingToReconnect] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const {token} = useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [maxWidth, setMaxWidth] = useState(0);
  const logLevelRefs = useRef([]);
  const scrollable = useRef(null);
  const [lastLogsEnd, setLastLogsEnd] = useState(0);
  
  const askMoreLogs = () => {
    const chunkSize = 50;
    const start = logs.length;
    const end = start + chunkSize;
    if (end === lastLogsEnd) {
      return;
    }
    console.log('asking for more logs from', start, 'to', start + 50, '...')
    setLastLogsEnd(end);
    try {
      clientRef.current.send(`getlogs_${start}_${end}`);
    } catch (e) {
      // console.error(e);
    }
  }
  
  const handleScroll = (e) => {
    let target;
    if (!e) {
      if (scrollable.current) {
        target = scrollable.current;
      }
    } else {
      target = e.target;
    }
    const currentScrollPos = target.scrollTop;
    // console.log('scrollpos', currentScrollPos);
    const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;
    if (bottom) {
      console.log('bottom');
      askMoreLogs();
      target.scrollTo(0, currentScrollPos-1);
    }
  }
  
  useEffect(() => {
    // Measure the max width of the log level element
      logLevelRefs.current.map((ref) => {
          // console.log(ref);
        const width = ref.current.offsetWidth + 0.1 * ref.current.offsetWidth;
        if (width > maxWidth) {
          setMaxWidth(width);
        }
      });
  }, [logLevelRefs.current]);
  
  useEffect(() => {
    if (waitingToReconnect) {
      return;
    }
    // Only set up the websocket once
    if (!clientRef.current && token) {
      const client = new WebSocket(`${protocol}://${import.meta.env.VITE_REACT_APP_HOST}/logs/ws/${Date.now()}?token=${token}`);
      clientRef.current = client;
      
      client.onerror = (e) => console.error(e);
      
      client.onopen = () => {
        setIsOpen(true);
        console.log('ws opened');
      };
      
      client.onclose = () => {
        
        if (clientRef.current) {
          // Connection failed
          console.log('ws closed by server');
        } else {
          // Cleanup initiated from app side, can return here, to not attempt a reconnect
          console.log('ws closed by app component unmount');
          return;
        }
        
        if (waitingToReconnect) {
          return;
        }
        
        // Parse event code and log
        setIsOpen(false);
        console.log('ws closed');
        
        // Setting this will trigger a r-erun of the effect,
        // cleaning up the current websocket, but not setting
        // up a new one right away
        setWaitingToReconnect(true);
        
        // This will trigger another re-run, and because it is false,
        // the socket will be set up again
        setTimeout(() => setWaitingToReconnect(null), 5000);
      };
      
      client.onmessage = message => {
        setIncomingMessage(message.data);
      };
      
      
      return () => {
        console.log('Cleanup');
        // Dereference, so it will set up next time
        clientRef.current = null;
        client.close();
        dispatch(clearLogs());
      }
    }
    
  }, []);
  
  useEffect(() => {
    if (incomingMessage) {
      const data = JSON.parse(incomingMessage);
      if ("log_records" in data) {
        dispatch(logsRefreshed(data));
      } else {
        if ((stateLocal.log_incr_value + 1 === data.log_incr_value) && (stateLocal.log_incr_value !== -1)) {
          // in sync, update state
          dispatch(logUpdateRecieved(data));
        } else {
          // out of sync, request full state
          try {
            dispatch(clearLogs());
            clientRef.current.send('getlogs_0_50');
          } catch (e) {
            console.error(e);
          }
        }
      }
      // handleScroll()
    }
  }, [incomingMessage]);
  
  // make logs a list of objects
  interface LogRecord {
    timeString: string;   // 15.03.2024_01:13:18
    logLevel: string;
    message: string;
    location: string;
  }
  const logs: LogRecord[] = stateLocal.log_records.map((logRecord: string) => {
    const [timeString, logLevel] = logRecord.split(' ', 2);
    const messageAndLocation = logRecord.split(' ').slice(2).join(' ');
    const message = messageAndLocation.split(' ').slice(0, -1).join(' ');
    const location = messageAndLocation.split(' ').slice(-1)[0];
    return {timeString, logLevel, message, location};
  });
  
  // Sort by timeString descending
  logs.sort((a, b) => {
    return a.timeString > b.timeString ? -1 : 1;
  });
  
  // Create a ref for each log level element
  logLevelRefs.current = logs.map((_, i) => logLevelRefs[i] || createRef());
  
  useEffect(() => {
    handleScroll(null);
  }, [scrollable.current]);
  
  return (
    <div style={{postition: 'absolute', overflowY: 'auto', height: '100vh'}}>
      {
        waitingToReconnect
          ? <Box><Radio color="default" checked={true}/>Connecting...</Box>
          : isOpen
            ? <Box><Radio color="success" checked={true}/>Connected</Box>
            : <Box><Radio color="error" checked={true}/>Disconnected</Box>
      }
      <Paper ref={scrollable} onScroll={handleScroll} style={{overflowY: 'scroll', height: '50vh', width: '70vw'}}>
        <Grid container direction="column">
        {logs.map((logRecord: string, i) => {
          const {timeString, logLevel, message, location} = logRecord;
          const color = logLevel === "[INFO]"
            ? colors.primary[100]
            : logLevel === "[WARNING]"
              ? colors.orangeAccent[300]
              : logLevel === "[ERROR]"
                ? colors.redAccent[300]
                : colors.grey[300];
          return (
            <Grid container justifyContent="space-between" key={i}>
              <Grid item xs zeroMinWidth>
                <Grid container direction="row">
                  <div style={{visibility: 'hidden', position: 'absolute'}} ref={logLevelRefs.current[i]}>
                    <Typography variant="h7" mr={1} >{logLevel}</Typography>
                  </div>
                  <Typography variant="h7" mr={1} color={colors.blueAccent[200]} key={i}>{localizedTime(timeString)} </Typography>
                  <Typography variant="h7" mr={1} color={color} style={{width: maxWidth}} align="center">{logLevel}</Typography>
                  <Typography variant="h7" mr={1} color={colors.grey[300]} style={{overflowWrap: 'break-word'}}>{message}</Typography>
                </Grid>
              </Grid>
              <Typography variant="h7" color={colors.grey[500]}>{location}</Typography>
            </Grid>
          );
        })
        }
        </Grid>
      </Paper>
    </div>
  );
}
