import {Box, Card, CardContent, Divider, Grid, IconButton, Paper, Radio, Typography, useTheme} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {tokens} from "../../theme";
import {addWindow, closeWindow, changeWindowPos} from "../../reducers/draggables";
import Draggable from "react-draggable";
import CloseIcon from '@mui/icons-material/Close';
import {CardHeader} from "../common/CardHeader";
import {GET_DRUGUSES_BY_ID} from "../../misc/gqlQueries";
import {useQuery} from "@apollo/client";
import {CardRow} from "../common/CardRow";


export interface DruguseProps {
  id: number;
  date: string;
  amount: string;
  drugname: string;
  owner: {
    telegramId: number,
    firstName?: string,
    lastName?: string,
    userName?: string
  };
  paincase: {
    id: number
  }
}


export function DruguseView({entity, short=false}) {
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
          Druguse {shortViewData.date}
        </Typography>
      </>
    )
  }
  
  const {loading, error, data} = useQuery(GET_DRUGUSES_BY_ID, {
    variables: {ids: [id]}
  });
  error && console.error(error);
  
  const props: DruguseProps = data
    ? data.druguses[0]
    : {
      id: -1,
      date: "Loading...",
      amount: "Loading...",
      drugname: "Loading...",
      owner: {telegramId: -1, firstName: "Loading..."},
      paincase: {id: -1}
    };
  
  const ownerStr = ''
    + (props.owner.firstName ? props.owner.firstName + ' ' : '')
    + (props.owner.lastName ? props.owner.lastName + ' ' : '')
    + (props.owner.userName ? '(@' + props.owner.userName + ')' : '')
  
  return (
    <CardContent>
      <CardRow left={props.drugname} right={props.amount + " mg"}/>
      <CardRow left="Owner" right={ownerStr}
                onClickHandler={() => dispatch(addWindow({name: "User", id: props.owner.telegramId}))}/>
      <CardRow left="Paincase" right={props.paincase.id.toString()}
                onClickHandler={() => dispatch(addWindow({name: "Paincase", id: props.paincase.id}))}/>
    </CardContent>
  );
}
