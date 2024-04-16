import {Box, Card, CardContent, Divider, Grid, IconButton, Paper, Radio, Typography, useTheme} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {addWindow, closeWindow, changeWindowPos} from "../../reducers/draggables";
import Draggable from "react-draggable";
import {tokens} from "../../theme";
import CloseIcon from '@mui/icons-material/Close';
import {CardHeader} from "../common/CardHeader";
import {useQuery} from "@apollo/client";
import {GET_PRESSURES_BY_ID} from "../../misc/gqlQueries";
import {CardRow} from "../common/CardRow";


export interface PressureProps {
  id: number;
  datetime: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  owner: {
    telegramId: number,
    firstName?: string,
    lastName?: string,
    userName?: string
  };
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
  
  const {loading, error, data} = useQuery(GET_PRESSURES_BY_ID, {
    variables: {ids: [id]}
  });
  error && console.error(error);
  
  
  const props: PressureProps = data
    ? data.pressures[0]
    : {
      id: "Loading...",
      datetime: "Loading...",
      systolic: 0,
      diastolic: 0,
      pulse: 0,
      owner: {telegramId: 0, firstName: "Loading..."}
    };
  
  const ownerStr = ''
    + (props.owner.firstName ? props.owner.firstName + ' ' : '')
    + (props.owner.lastName ? props.owner.lastName + ' ' : '')
    + (props.owner.userName ? '(@' + props.owner.userName + ')' : '');
  return (
    <>
      <CardRow left="" right={`${props.systolic}/${props.diastolic} mmHg, ${props.pulse} bpm`}/>
      <CardRow left="Owner" right={ownerStr}
               onClickHandler={() => dispatch(addWindow({name: "User", id: props.owner.telegramId}))}/>
    </>

);
}
