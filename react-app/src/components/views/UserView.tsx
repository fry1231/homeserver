import {Card, CardContent, Link, Typography, useTheme, Divider} from "@mui/material";
import {useEffect, useState, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import {tokens} from "../../theme";
import {addWindow, closeWindow, changeWindowPos, DraggableEntity} from "../../reducers/draggables";
import Draggable from "react-draggable";
import {CardHeader} from "../common/CardHeader";
import {CardRow} from "../common/CardRow";
import {useQuery} from "@apollo/client";
import {GET_USER_BY_ID} from "../../misc/gqlQueries";


export interface UserProps {
  telegramId: string | number;
  lastNotified: string;
  notifyEvery: string | number;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  joined: string | null;
  timezone: string;
  language: string;
  utcNotifyAt: string;
  latitude: number | null;
  longitude: number | null;
  
  paincases: {id: number, date: string}[];
  druguses: { id: number, date: string }[];
  pressures: { id: number, datetime: string }[];
}

export function UserView({entity, short=false}) {
  const dispatch = useDispatch();
  const statePositions = useSelector((state) => state.positions);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const name = entity.name;
  if (!name.includes("User")) {
    console.error("Wrong component used for entity", entity)
  }
  const [id, setId] = useState();
  useEffect(() => {
    setId(entity.id);
  }, [entity.id]);
  const pos = entity.pos;
  const shortViewData = entity.shortViewData;
  
  const showMap = (lat, lon) => {
    console.log("show map" + lat + lon);
  }
  const showPaincases = (paincases: { id, date }[]) => {
    const nestedContent = paincases.map(({id, date}) => ({name: "Paincase", id, date}));
    dispatch(addWindow({name: "List", id: statePositions.n, nestedContent}));
  }
  const showDruguses = (druguses: { id, date }[]) => {
    const nestedContent = druguses.map(({id, date}) => ({name: "Druguse", id, date}));
    dispatch(addWindow({name: "List", id: statePositions.n, nestedContent}));
  }
  const showPressures = (pressures: { id, datetime }[]) => {
    const nestedContent = pressures.map(({id, datetime}) => ({name: "Pressure", id, datetime}));
    dispatch(addWindow({name: "List", id: statePositions.n, nestedContent}));
  }
  
  if (short) {
    // telegramId, firstName, lastName, userName    are required
    if (!shortViewData) {
      console.error("No shortViewData for entity!", entity);
      return;
    }
    return (
      <Typography variant="body2"
                  onClick={() => dispatch(addWindow({name, id: id}))}>
        User {shortViewData.firstName} {shortViewData.lastName} {shortViewData.userName ? `(@${shortViewData.userName})` : null}
      </Typography>
    )
  }
  
  // If not shortView, fetch data
  const {loading, error, data} = useQuery(GET_USER_BY_ID, {
    variables: {id}
  });
  error && console.error(error);
  
  const props: UserProps = data
    ? data.user
    : {
    telegramId: "Loading...",
    lastNotified: "Loading...",
    notifyEvery: "Loading...",
    firstName: "Loading...",
    lastName: "Loading...",
    userName: "Loading...",
    joined: "Loading...",
    timezone: "Loading...",
    language: "Loading...",
    utcNotifyAt: "Loading...",
    latitude: null,
    longitude: null,
    paincases: [],
    druguses: [],
    pressures: []
  };
  
  return (
    <CardContent>
      {/*Header*/}
      <Typography display="inline" color={colors.orangeAccent[500]} variant="body2" component="p">
        {props.firstName ? props.firstName : ""} {props.lastName ? props.lastName : null}
      </Typography><Typography ml={1} display="inline" color={colors.orangeAccent[500]} variant="body2"
                               component="p">({props.language})</Typography>
      {props.userName
        ? <Link ml={2} href={`https://t.me/${props.userName}`} target="_blank" color={colors.orangeAccent[500]} variant="body2">@{props.userName}</Link>
        : null}
      <br/>
      
      {/*General info*/}
      <CardRow left="Joined" right={props.joined}/>
      <CardRow left="Timezone" right={props.timezone}/>
      <CardRow left="Notify every" right={props.notifyEvery}/>
      <CardRow left="Notify at" right={props.utcNotifyAt}/>
      
      {/*Location*/}
      {props.latitude && props.longitude
        ? <CardRow left="Location" right={`${Math.round(props.latitude * 100) / 100}, ${Math.round(props.longitude * 100) / 100}`}
                   onClickHandler={() => showMap(props.latitude, props.longitude)}/>
        : null}
      
      {/*Paincases, Druguses, Pressures. 'show*' calls a list with entities */}
      <CardRow left="Paincases" right={props.paincases.length} onClickHandler={() => showPaincases(props.paincases)}/>
      <CardRow left="Druguses" right={props.druguses.length} onClickHandler={() => showDruguses(props.druguses)}/>
      <CardRow left="Pressures" right={props.pressures.length} onClickHandler={() => showPressures(props.pressures)}/>
      
    </CardContent>
  );
}
