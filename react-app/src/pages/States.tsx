import {Box, Paper, Radio, Typography} from "@mui/material";
import {useEffect, useState, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import {statesRefreshed, stateUpdateRecieved} from "../reducers/states";
import stateInstance from "../reducers/states";
import {setToken} from "../reducers/auth";
import {getAxiosClient, getNewAcessToken} from "../misc/AxiosInstance";
import {addWindow} from "../reducers/draggables";
import {DraggableEntity} from "../reducers/draggables";
import {useNavigate} from "react-router-dom";


export default function States() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stateLocal = useSelector((state) => state.states);
  const statePositions = useSelector((state) => state.positions);
  let protocol: string;
  import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? protocol = "wss" : protocol = "ws";
  
  const clientRef = useRef<WebSocket | null>(null);
  const [waitingToReconnect, setWaitingToReconnect] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const {token} = useSelector((state) => state.auth);
  const axiosClient = getAxiosClient();
  
  useEffect(() => {
    
    if (waitingToReconnect) {
      return;
    }
    // Only set up the websocket once
    if (!clientRef.current && token) {
      const client = new WebSocket(`${protocol}://${import.meta.env.VITE_REACT_APP_HOST}/states/ws/${Date.now()}?token=${token}`);
      clientRef.current = client;
      
      client.onerror = (e) => {
        const refresh = async () => {
          try {
            const newToken = await getNewAcessToken(axiosClient);
            dispatch(setToken(newToken));
          } catch (error) {
            navigate('/login');
          }
        }
        refresh();
      }
      
      client.onopen = () => {
        setIsOpen(true);
      };
      
      client.onclose = () => {
        
        if (clientRef.current) {
          // Connection failed
          console.log('ws closed by server');
        } else {
          // Cleanup initiated from app side, can return here, to not attempt a reconnect
          return;
        }
        
        if (waitingToReconnect) {
          return;
        }
        
        // Parse event code and log
        setIsOpen(false);
        
        // Setting this will trigger a re-run of the effect,
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
        // Dereference, so it will set up next time
        clientRef.current = null;
        client.close();
      }
    }
    
  }, [token]);
  
  useEffect(() => {
    if (incomingMessage) {
      const data = JSON.parse(incomingMessage);
      if ("states" in data) {
        dispatch(statesRefreshed(data));
      } else {
        if ((stateLocal.incr_value + 1 === data.incr_value) && (stateLocal.incr_value !== -1)) {
          // in sync, update state
          dispatch(stateUpdateRecieved(data));
        } else {
          // out of sync, request full state
          try {
            clientRef.current.send('refresh_states');
          }
          catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, [incomingMessage]);
  
  // Sort states by form name and step number
  const forms: stateInstance[][] = [];
  if (stateLocal.incr_value !== -1) {
    const uniqueFormNames: Set<string> = new Set();
    let maxNum = 0;
    stateLocal.states.map((step) => {
      const [formName, numStr] = step.state_name.split(':');
      uniqueFormNames.add(formName);
      const num = parseInt(numStr);
      maxNum = Math.max(maxNum, num + 1);
    });
    const formNames = Array.from(uniqueFormNames);
    formNames.map((formName) => {
      const steps: stateInstance[] = new Array(maxNum);
      stateLocal.states.map((state) => {
        if (state.state_name.startsWith(formName)) {
          const step: stateInstance = {state_name: state.state_name, user_ids: state.user_ids};
          // Sort by step number
          steps[parseInt(state.state_name.split(':')[1])] = step;
        }
      });
      forms.push(steps);
    });
  }
  
  return (
    <>
      {
        waitingToReconnect
        ? <Box><Radio color="default" checked={true} />Connecting...</Box>
        : isOpen
          ? <Box><Radio color="success" checked={true} />Connected</Box>
          : <Box><Radio color="error" checked={true} />Disconnected</Box>
      }
      {forms.map((steps, i) => {
        return(
          <Paper key={i}>
              <Typography variant="h5" mx={2}>{steps[0].state_name.split(':')[0]}</Typography>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                m: 1,
                p: 1,
                borderRadius: 1,
                boxShadow: 1
              }}>
                {steps.map((state, j) => {
                  return (
                    <Box key={j} mx={1} display="flex" flexDirection="column" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">{state.state_name.split(':')[2]}</Typography>
                      
                      <Typography variant="h6"
                        color={state.user_ids.length > 0 ? 'error' : 'textPrimary'}
                        style={{backgroundColor: state.user_ids.length > 0 ? 'error' : 'textPrimary'}}
                        onClick={() => {
                          const userEntities: DraggableEntity[] = [];
                          state.user_ids.map((userId) => {
                            userEntities.push({name: "User", id: userId});
                          });
                          dispatch(addWindow({name: "List", id: statePositions.n, nestedContent: userEntities}))
                        }}
                      >{state.user_ids.length}</Typography>
                    </Box>
                  );
                  
                })}
              </Box>
          </Paper>
        );
      })}
    </>
  );
}
