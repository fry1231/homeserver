import {Box, Card, CardContent, Divider, Grid, IconButton, Paper, Radio, Typography, useTheme} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {tokens} from "../../theme";
import {addWindow, closeWindow, changeWindowPos} from "../../reducers/draggables";
import Draggable from "react-draggable";
import CloseIcon from '@mui/icons-material/Close';
import {CardHeader} from "../common/CardHeader";


export interface DruguseProps {
  id: number;
  date: string;
  amount: string;
  drugname: string;
  owner_id: number;
  paincase_id: number | null;
}


export function DruguseView({entity, short=false}) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const name = entity.name;
  const id = entity.id;
  const props = entity.props;
  const pos = entity.pos;
  const shortViewData = entity.shortViewData;
  
  if (short) {
    return (
      <>
        <Typography variant="body2"
                    onClick={() => dispatch(addWindow({name, id}))}>
          Druguse {shortViewData.date}
        </Typography>
      </>
    )
  }
  
  return (
    <Draggable
      // enableUserSelectHack={false}
      position={{x: pos.x, y: pos.y}}
      onStop={(event, data) => {
        dispatch(changeWindowPos({name, id, pos: {x: data.x, y: data.y}}))
      }}
      onStart={(event, data) => {
        dispatch(changeWindowPos({name, id, pos: {x: data.x, y: data.y}}))
      }}
      handle=".handle"
    >
      <Card style={{position: "absolute", zIndex: pos.z}}>
        <CardContent>
          
          <CardHeader entityName={name} entityId={id} left={`Druguse #${props.id}`} center={props.date}/>
          <Divider/>
          
          <Typography ml={2} variant="body2" component="p">
            {props.drugname}: {props.amount} (mg)
          </Typography>
          
        </CardContent>
      </Card>
    </Draggable>
  );
}
