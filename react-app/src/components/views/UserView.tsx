import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Link,
  IconButton,
  Paper,
  Radio,
  Typography,
  useTheme, Divider
} from "@mui/material";
import {useEffect, useState, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import {statesRefreshed, stateUpdateRecieved} from "../../reducers/states";
import stateInstance from "../../reducers/states";
import {useAuth} from "../../misc/authProvider.jsx";
import {tokens} from "../../theme";
import {addWindow, closeWindow, changeWindowPos} from "../../reducers/draggables";
import Draggable from "react-draggable";
import CloseIcon from "@mui/icons-material/Close";
import {CardHeader} from "../common/CardHeader";
import {CardRow} from "../common/CardRow";
import {PaincaseProps} from "./PaincaseView";
import {DruguseProps} from "./DruguseView";
import {PressureProps} from "./PressureView";


export interface UserProps {
  telegram_id: string | number;
  last_notified: string;
  notify_every: string | number;
  first_name: string | null;
  last_name: string | null;
  user_name: string | null;
  joined: string;
  timezone: string;
  language: string;
  utc_notify_at: string;
  latitude: number | null;
  longitude: number | null;
  
  n_paincases: number;
  n_druguses: number;
  n_pressures: number;
  
  paincases: PaincaseProps[];
  druguses: DruguseProps[];
  pressures: PressureProps[];
}

export function UserView({entity, short=false}) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const name = entity.name;
  const props = entity.props;
  const pos = entity.pos;
  
  const showMap = () => {
    console.log("show map");
  }
  const showPaincases = () => {
  
  }
  const showDruguses = () => {
  
  }
  const showPressures = () => {
  
  }
  
  if (short) {
    return (
      <>
        <Typography variant="body2"
                    onClick={() => dispatch(addWindow(entity))}>
          User {entity.first_name} {entity.last_name} (@{entity.user_name})
        </Typography>
      </>
    )
  }
  
  return (
    <Draggable
      // enableUserSelectHack={false}
      position={{x: pos.x, y: pos.y}}
      onStop={(event, data) => {
        dispatch(changeWindowPos({name, pos: {x: data.x, y: data.y}}))
      }}
      onStart={(event, data) => {
        dispatch(changeWindowPos({name, pos: {x: data.x, y: data.y}}))
      }}
      handle=".handle"
    >
      <Card style={{position: "absolute", zIndex: pos.z}}>
        <CardContent>
          
          <CardHeader entityName={name} left={`User ID${props.telegram_id}`}/>
          <Divider/>
          
          <Typography display="inline" color={colors.orangeAccent[500]} variant="body2" component="p">
            {props.first_name ? props.first_name : ""} {props.last_name ? props.last_name : null}
          </Typography><Typography ml={1} display="inline" color={colors.orangeAccent[500]} variant="body2"
                                   component="p">({props.language})</Typography>
          {props.user_name
            ? <Link ml={2} href={`https://t.me/${props.user_name}`} color={colors.orangeAccent[500]} variant="body2">@{props.user_name}</Link>
            : null}
          <br/>
          
          <CardRow left="Joined" right={props.joined}/>
          <CardRow left="Timezone" right={props.timezone}/>
          <CardRow left="Notify every" right={props.notify_every}/>
          <CardRow left="Notify at" right={props.utc_notify_at}/>
          
          {props.latitude && props.longitude ?
            <>
              <Typography color={colors.grey[300]} display="inline" variant="body2" component="p">
                Location:
              </Typography>
              <Link ml={1} component="button" variant="body2" color="inherit" onClick={showMap}>{props.latitude}, {props.longitude}</Link>
              <br/>
            </>
          : null}
          <Typography color={colors.grey[300]} display="inline" variant="body2" component="p">
            Paincases:
            </Typography> <Link component="button" variant="body2" color="inherit" onClick={showPaincases}>
          {props.n_paincases}
          </Link><br/>
          <Typography color={colors.grey[300]} display="inline" variant="body2" component="p">
            Druguses:
            </Typography> <Link component="button" variant="body2" color="inherit" onClick={showDruguses}>
          {props.n_druguses}
          </Link><br/>
          <Typography color={colors.grey[300]} display="inline" variant="body2" component="p">
            Pressures:
            </Typography> <Link component="button" variant="body2" color="inherit" onClick={showPressures}>
          {props.n_pressures}
          </Link><br/>
          
        </CardContent>
      </Card>
    </Draggable>
  );
}
