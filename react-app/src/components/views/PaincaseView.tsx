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
import {changeWindowPos, addWindow, closeWindow} from "../../reducers/draggables";
import {DruguseProps} from "./DruguseView";
import {DraggableEntity} from "../../reducers/draggables";
import {tokens} from "../../theme";
import Draggable from 'react-draggable';
import CloseIcon from '@mui/icons-material/Close';
import {CardHeader} from "../common/CardHeader";
import {CardRow} from "../common/CardRow";
import {GET_PAINCASES_BY_ID} from "../../misc/gqlQueries";
import {useQuery} from "@apollo/client";


export interface PaincaseProps {
  id: number;
  date: string;
  durability: number;
  intensity: number;
  aura: boolean;
  provocateurs: string | null;
  symptoms: string | null
  description: string | null;
  owner: {
    telegramId: number;
    firstName?: string;
    lastName?: string;
    userName?: string;
  };
  medecine_taken: DruguseProps[];
}


export function PaincaseView({entity, short=false}) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
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
          Paincase {shortViewData.date}
        </Typography>
      </>
    )
  }
  
  const {loading, error, data} = useQuery(GET_PAINCASES_BY_ID, {
    variables: {ids: [id]}
  });
  error && console.error(error);
  
  const props: PaincaseProps = data
    ? data.paincases[0]
    : {
      id: -1,
      date: "Loading...",
      durability: -1,
      intensity: -1,
      aura: false,
      provocateurs: "Loading...",
      symptoms: "Loading...",
      description: "Loading...",
      owner: {telegramId: 0, firstName: "Loading..."},
      medecine_taken: []
    };
  
  const ownerStr = ''
    + (props.owner.firstName ? props.owner.firstName + ' ' : '')
    + (props.owner.lastName ? props.owner.lastName + ' ' : '')
    + (props.owner.userName ? '(@' + props.owner.userName + ')' : '');
  
  return (
    <CardContent>
      <CardRow left="Durability" right={props.durability} />
      <CardRow left="Intensity" right={props.intensity} />
      <CardRow left="Aura" right={props.aura.toString()} />
      <CardRow left="Provocateurs" right={props.provocateurs} />
      <CardRow left="Symptoms" right={props.symptoms} />
      <CardRow left="Description" right={props.description ? props.description : "—"}/>
      
      {("medecine_taken" in props) && (props.medecine_taken.length !== 0)
        ? props.medecine_taken.map((druguse: DruguseProps, i: number) => {
            const drugname = druguse.drugname;
            const amount = druguse.amount;
            return (
              <>
                <Typography color={colors.grey[300]} variant="body2" component="p">
                  Medecine taken:</Typography>
                <Typography key={i} ml={2} variant="body2" component="p">
                  {drugname}: {amount}
                </Typography>
              </>
            );
          })
        : <CardRow left="Medecine taken" right="—" />
      }
      <CardRow left="Owner" right={ownerStr}
               onClickHandler={() => dispatch(addWindow({name: "User", id: props.owner.telegramId}))}/>
    </CardContent>
  );
}
