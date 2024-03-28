import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Radio,
  Typography,
  useTheme
} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {windowPosChanged, windowAdded, windowClosed} from "../../reducers/positions";
import {DruguseProps} from "./DruguseView";
import {DraggableEntity} from "../../reducers/positions";
import {tokens} from "../../theme";
import Draggable from 'react-draggable';
import CloseIcon from '@mui/icons-material/Close';
import {CardHeader} from "../common/CardHeader";
import {CardRow} from "../common/CardRow";


export interface PaincaseProps {
  id: number;
  date: string;
  durability: number;
  intensity: number;
  aura: boolean;
  provocateurs: string | null;
  symptoms: string | null
  description: string | null;
  owner_id: number;
  medecine_taken: DruguseProps[] | null;
}


export function PaincaseView({entity, short=false}) {
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
          Paincase {entity.date}
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
      <Card style={{ position: "absolute", zIndex: pos.z }}>
        <CardContent>
          
          <CardHeader entityName={name} left={`Paincase #${props.id}`} center={props.date} />
          <Divider />
          <CardRow left="Durability" right={props.durability} />
          <CardRow left="Intensity" right={props.intensity} />
          <CardRow left="Aura" right={props.aura.toString()} />
          <CardRow left="Provocateurs" right={props.provocateurs} />
          <CardRow left="Symptoms" right={props.symptoms} />
          <CardRow left="Description" right={props.description ? props.description : "—"}/>
          
          <Typography color={colors.grey[300]} variant="body2" component="p">
            Medecine taken:</Typography>
          {("medecine_taken" in props) && (props.medecine_taken.length !== 0)
            ? props.medecine_taken.map((druguse: DruguseProps, i: number) => {
                const drugname = druguse.drugname;
                const amount = druguse.amount;
                return (
                  <Typography key={i} ml={2} variant="body2" component="p">
                    {drugname}: {amount}
                  </Typography>
                );
              })
            : "—" }
          
        </CardContent>
      </Card>
    </Draggable>
  );
}
