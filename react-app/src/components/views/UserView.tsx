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
  
  paincases: number[];   // IDs
  druguses: number[];
  pressures: number[];
}

export function UserView({entity, short=false}) {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.positions);
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
    // telegramId, firstName, lastName, userName    are required
    if (!shortViewData) {
      console.error("No shortViewData for entity!", entity);
      return;
    }
    return (
      <>
        <Typography variant="body2"
                    onClick={() => dispatch(addWindow({name, id: id}))}>
          User {shortViewData.firstName} {shortViewData.lastName} (@{shortViewData.userName})
        </Typography>
      </>
    )
  }
  
  // If not shortView, fetch data
  const {loading, error, data} = useQuery(GET_USER_BY_ID, {
    variables: {id}
  });
  
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
          
          <CardHeader entityName={name} entityId={id} left={`User ID${props.telegramId}`}/>
          <Divider/>
          {/*{loadingState ? <Typography>{loadingState}</Typography> : null}*/}
          
          <Typography display="inline" color={colors.orangeAccent[500]} variant="body2" component="p">
            {props.firstName ? props.firstName : ""} {props.lastName ? props.lastName : null}
          </Typography><Typography ml={1} display="inline" color={colors.orangeAccent[500]} variant="body2"
                                   component="p">({props.language})</Typography>
          {props.userName
            ? <Link ml={2} href={`https://t.me/${props.userName}`} color={colors.orangeAccent[500]} variant="body2">@{props.userName}</Link>
            : null}
          <br/>
          
          <CardRow left="Joined" right={props.joined}/>
          <CardRow left="Timezone" right={props.timezone}/>
          <CardRow left="Notify every" right={props.notifyEvery}/>
          <CardRow left="Notify at" right={props.utcNotifyAt}/>
          
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
          {props.paincases.length}
          </Link><br/>
          <Typography color={colors.grey[300]} display="inline" variant="body2" component="p">
            Druguses:
            </Typography> <Link component="button" variant="body2" color="inherit" onClick={showDruguses}>
          {props.druguses.length}
          </Link><br/>
          <Typography color={colors.grey[300]} display="inline" variant="body2" component="p">
            Pressures:
            </Typography> <Link component="button" variant="body2" color="inherit" onClick={showPressures}>
          {props.pressures.length}
          </Link><br/>
          
        </CardContent>
      </Card>
    </Draggable>
  );
}
