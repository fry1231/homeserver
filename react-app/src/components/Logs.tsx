import {Box, Grid, LinearProgress, Paper, Radio, Typography} from "@mui/material";
import {useEffect, useState, useRef, createRef } from "react";
import {useDispatch, useSelector} from "react-redux";
import {logsRefreshed, logUpdateRecieved, clearLogs} from "../reducers/logs";
import {tokens} from "../theme";
import {useTheme} from "@mui/material/styles";
import {addWindow} from "../reducers/draggables";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import {useNavigate} from "react-router-dom";
import {getNewAccessToken} from "../misc/AxiosInstance";
import {setToken} from "../reducers/auth";


/**
 * Parse date in `30.04.2024_19:04:56` format (UTC) to Date object in local time
 * @param timeString
 */
const localizedTime = (timeString: string) => {
  const [datePart, timePart] = timeString.split('_');
  const [day, month, year] = datePart.split('.');
  const [hours, minutes, seconds] = timePart.split(':');
  const normalizedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  const parsedDate = new Date(normalizedDate);
  return parsedDate.toLocaleString("ru-RU");
}


export default function Logs({logLevels}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stateLocal = useSelector((state) => state.logs);
  let protocol: string;
  import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? protocol = "wss" : protocol = "ws";
  
  const clientRef = useRef(null);
  const [waitingToReconnect, setWaitingToReconnect] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const token = localStorage.getItem("token");
  
  const [maxWidth, setMaxWidth] = useState(0);
  const logLevelRefs = useRef([]);
  const scrollable = useRef(null);
  const [lastLogsEnd, setLastLogsEnd] = useState(0);
  
  // Ask for more logs when the user scrolls to the bottom
  const askMoreLogs = (startPos) => {
    const chunkSize = 50;
    let start;
    if (startPos === undefined) {
      start = logs.length;
    } else {
      start = startPos;
    }
    const end = start + chunkSize;
    if (end === lastLogsEnd) {
      return;
    }
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
    const botOffsetFloored = Math.floor((target.scrollHeight - target.scrollTop) / 10);
    const bottom = botOffsetFloored === Math.floor(target.clientHeight / 10);

    if (bottom) {
      askMoreLogs();
      target.scrollTo(0, currentScrollPos-1);
    }
  }
  
  // Measure the max width of the log level element to set the width of the column
  useEffect(() => {
      logLevelRefs.current.map((ref) => {
        const width = ref.current.offsetWidth + 0.1 * ref.current.offsetWidth;
        if (width > maxWidth) {
          setMaxWidth(width);
        }
      });
  }, [logLevelRefs.current]);
  
  // Set up the websocket connection
  useEffect(() => {
    if (waitingToReconnect) {
      return;
    }
    // Only set up the websocket once
    if (token && !clientRef.current) {
      console.log('token', token);
      const client = new WebSocket(`${protocol}://${import.meta.env.VITE_REACT_APP_HOST}/logs/ws/${Date.now()}?token=${token}`);
      clientRef.current = client;
      
      client.onerror = (e) => {
        const refresh = async () => {
          try {
            const newToken = await getNewAccessToken();
            dispatch(setToken(newToken));
            console.log('new token', newToken);
          } catch (error) {
            navigate('/login');
          }
        }
        refresh();
      };
      
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
        // setWaitingToReconnect(true);
        
        // This will trigger another re-run, and because it is false,
        // the socket will be set up again
        // setTimeout(() => setWaitingToReconnect(null), 500);
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
  
  // Handle incoming messages
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
    }
  }, [incomingMessage]);
  
  // make logs a list of objects
  interface LogRecord {
    timeString: string;   // 15.03.2024_01:13:18
    logLevel: string;
    message: string;
    location: string;
  }
  let logs: LogRecord[] = stateLocal.log_records.map((logRecord: string) => {
    const [timeString, logLevel] = logRecord.split(' ', 2);
    let messageAndLocation = logRecord.split(' ').slice(2).join(' ');
    let message = messageAndLocation.split(' ').slice(0, -1).join(' ');
    let location = messageAndLocation.split(' ').slice(-1)[0];
    if (!location.startsWith('(')) {
      message += ' ' + location;
      location = '';
    }
    return {timeString, logLevel, message, location};
  });
  
  // Filter by log level
  if (logLevels)
    logs = logs.filter((log) => logLevels.includes(log.logLevel.replace('[', '').replace(']', '')));
  
  // Sort by timeString descending
  logs.sort((a, b) => {
    return new Date(a.timeString) > new Date(b.timeString) ? -1 : 1;
  });
  
  // Create a ref for each log level element
  logLevelRefs.current = logs.map((_, i) => logLevelRefs[i] || createRef());
  
  useEffect(() => {
    handleScroll(null);
  }, [scrollable.current]);
  
  /** Format the log message, transforming User <id> into a clickable link if necessary */
  const FormattedMessage = ({message}) => {
    const [isFolded, setIsFolded] = useState(true);
    const [rowWidth, setRowWidth] = useState(50000);
    // Determing the maximum length of the message, fitting the row width
    const [isOverflowing, setIsOverflowing] = useState(false);
    const messageRef = useRef(null);
    // useEffect(() => {
    //   if (messageRef.current) {
    //     const currMessage = messageRef.current;
    //
    //     // Save the original white-space style
    //     const originalWhiteSpace = currMessage.style.whiteSpace;
    //
    //     // Change the white-space to 'nowrap' and check the height
    //     currMessage.style.whiteSpace = 'nowrap';
    //     const nowrapHeight = currMessage.clientHeight;
    //
    //     // Change the white-space back to the original style and check the height
    //     currMessage.style.whiteSpace = originalWhiteSpace;
    //     const normalHeight = currMessage.clientHeight;
    //
    //     const width = currMessage.offsetWidth;
    //     setRowWidth(width);
    //
    //     // If the height increases when the text is wrapped, it means the text is overflowing
    //     if (normalHeight > nowrapHeight) {
    //       setIsOverflowing(true);
    //       setIsFolded(true);
    //     }
    //   }
    // }, [message]);
    const maxLength = 150;
    const messageParts = message.split(/(User \d+|User is None)/).filter(Boolean);
    const toggleFold = () => {
      setIsFolded(!isFolded);
    };
    return (
      <>
        {messageParts.map((part, i) => {
          if (part.startsWith("User") && !part.startsWith("User ID cannot")) {
            const userId = parseInt(part.replace("User ", ""));
            return (
              <div key={i}>
                <Typography variant="h7" color={colors.grey[300]}>User</Typography>
                {
                  !isNaN(userId)
                    ? <Typography variant="h7" color={colors.orangeAccent[300]}
                                  onClick={() => dispatch(
                                    addWindow({name: "User", id: parseInt(userId)})
                                  )}
                    > {userId}</Typography>
                    : <Typography variant="h7" color={colors.grey[300]}> is None</Typography>
                }
              </div>
            );
          } else {
            // Display only the first maxLength characters of the message
            const displayText = isFolded && part.length > maxLength ? `${part.substring(0, maxLength)}` : part;
            // Styles
            const foldedStyle = {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: `${rowWidth}px`
            };
            const unfoldedStyle = {
              overflowWrap: 'anywhere',
              // whiteSpace: 'pre-wrap',
              // maxWidth: `${rowWidth}px`
            };
            
            // Split the text into lines on \n
            return displayText.split('\n').map((line, j) => (
                <Typography
                  ref={messageRef}
                  // style={{
                  //   overflowWrap: 'anywhere',
                  //   overflow: 'hidden',
                  //   textOverflow: 'ellipsis',
                  //   whiteSpace: 'nowrap',
                  //   maxWidth: `${rowWidth}px`
                  // }}
                  style={isFolded ? foldedStyle : unfoldedStyle}
                  ml={(j === 0) && (line.startsWith('.')) ? 0 : 1}
                  key={`${i}-${j}`}
                  variant="h7"
                  color={colors.grey[300]}
                  component="p">{line}</Typography>
            ));
          }
        })}
        {/*{isFolded && message.length > maxLength &&   // unfold button if the message is longer than maxLength*/}
        {/*    <Typography display="inline" variant="h7" color={colors.grey[300]} onClick={toggleFold}>*/}
        {/*        <UnfoldMoreIcon color="secondary" />*/}
        {/*    </Typography>}*/}
        {/*{!isFolded && message.length > maxLength &&   // fold button if the message is longer than maxLength*/}
        {/*    <Typography display="inline" variant="h7" color={colors.grey[300]} onClick={toggleFold}>*/}
        {/*        <UnfoldLessIcon color="error" />*/}
        {/*    </Typography>}*/}
        {isFolded && <MoreHorizIcon onClick={toggleFold} />}
        
      </>
    );
  }

  return (
    <Box style={{overflow: 'hidden'}}>
      <Paper ref={scrollable} onScroll={handleScroll} style={{position: 'relative', overflowY: 'scroll', height: '80vh', width: '80vw'}}>
        {
          waitingToReconnect || !isOpen
            ? <LinearProgress/>
            : null
        }
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
                  <FormattedMessage message={message}/>
                </Grid>
              </Grid>
              <Typography variant="h7" color={colors.grey[500]}>{location}</Typography>
            </Grid>
          );
        })}
        </Grid>
      </Paper>
    </Box>
  );
}
