import {Box, Card, CardContent, Divider, Grid, IconButton, Paper, Radio, Typography, useTheme} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {addWindow, closeWindow, changeWindowPos} from "../../reducers/draggables";
import Draggable from "react-draggable";
import {tokens} from "../../theme";
import CloseIcon from '@mui/icons-material/Close';
import {CardHeader} from "../common/CardHeader";
import {useQuery} from "@apollo/client";
import {GET_PRESSURE_BY_ID} from "../../misc/gqlQueries";
import {CardRow} from "../common/CardRow";


export interface PressureProps {
  id: number;
  datetime: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  owner: number;
}

export function PressureView({entity, short=false}) {
  const dispatch = useDispatch();
  const name = entity.name;
  const id = entity.id;
  const shortViewData = entity.shortViewData;
  
  if (short) {
    if (!shortViewData) {
      console.error("No shortViewData for entity", entity);
    }
    return (
      <>
        <Typography variant="body2"
                    onClick={() => dispatch(addWindow({name, id}))}>
          Pressure {shortViewData.datetime}
        </Typography>
      </>
    )
  }
  
  const {loading, error, data} = useQuery(GET_PRESSURE_BY_ID, {
    variables: {id}
  });
  error && console.error(error);
  
  const props: PressureProps = data
    ? data.pressure
    : {
      id: "Loading...",
      datetime: "Loading...",
      systolic: 0,
      diastolic: 0,
      pulse: 0,
      owner: 0
    };
  
  
  return (
    <>
      <Typography display="inline" variant="body2" component="p">
        {props.systolic}/{props.diastolic} mmHg, {props.pulse} bpm
      </Typography>
      <CardRow left="Owner" right={props.owner}
               onClickHandler={() => dispatch(addWindow({name: "User", id: props.owner}))}/>
    </>

);
}
