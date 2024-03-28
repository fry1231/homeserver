import {Box, Card, CardContent, Divider, Grid, IconButton, Paper, Radio, Typography, useTheme} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {windowAdded, windowClosed, windowPosChanged} from "../../reducers/positions";
import Draggable from "react-draggable";
import {tokens} from "../../theme";
import CloseIcon from '@mui/icons-material/Close';
import {CardHeader} from "../common/CardHeader";


export interface PressureProps {
  id: number;
  datetime: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  owner_id: number;
}

export function PressureView({entity, short=false}) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const name = entity.name;
  const props = entity.props;
  const pos = entity.pos;
  
  if (short) {
    return (
      <>
        <Typography variant="body2"
                    onClick={() => dispatch(windowAdded(entity))}>
          Pressure {entity.datetime}
        </Typography>
      </>
    )
  }
  
  return (
    <Draggable
      // enableUserSelectHack={false}
      position={{x: pos.x, y: pos.y}}
      onStop={(event, data) => {
        dispatch(windowPosChanged({name, pos: {x: data.x, y: data.y}}))
      }}
      onStart={(event, data) => {
        dispatch(windowPosChanged({name, pos: {x: data.x, y: data.y}}))
      }}
      handle=".handle"
    >
      <Card style={{position: "absolute", zIndex: pos.z}}>
        <CardContent>
          
          <CardHeader entityName={name} left={`Pressure #${props.id}`} center={props.datetime}/>
          <Divider/>
          
          <Typography display="inline" variant="body2" component="p">
            {props.systolic}/{props.diastolic} mmHg, {props.pulse} bpm
          </Typography>
          
        </CardContent>
      </Card>
    </Draggable>
  );
}
