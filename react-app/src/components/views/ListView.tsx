import {PaincaseProps, PaincaseView} from "./PaincaseView";
import {DruguseProps, DruguseView} from "./DruguseView";
import {PressureProps, PressureView} from "./PressureView";
import {UserProps, UserView} from "./UserView";
import {Card, CardContent, Divider, List, Typography} from "@mui/material";
import Draggable from "react-draggable";
import {changeWindowPos} from "../../reducers/draggables";
import {useDispatch} from "react-redux";
import {tokens} from "../../theme";
import {useTheme} from "@mui/material";
import {CardHeader} from "../common/CardHeader";
import {DraggableEntity} from "../../reducers/draggables";
import {GET_LIST_ITEMS_SHORT} from "../../misc/gqlQueries";
import {useQuery} from "@apollo/client";


export const ListView = ({entity}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const name = entity.name;
  const id = entity.id;
  const pos = entity.pos;
  const requiredEntities = entity.nestedContent;
  const userIds = [];
  const painIds = [];
  const druguseIds = [];
  const pressureIds = [];
  let listEntities = [];
  if (requiredEntities) {
    requiredEntities.forEach((entity) => {
      if (entity.name.includes("User")) {
        userIds.push(entity.id);
      } else if (entity.name.includes("Paincase")) {
        painIds.push(entity.id);
      } else if (entity.name.includes("Druguse")) {
        druguseIds.push(entity.id);
      } else if (entity.name.includes("Pressure")) {
        pressureIds.push(entity.id);
      } else {
        listEntities.push(entity);
      }
    });
  }
  const {loading, error, data} = useQuery(GET_LIST_ITEMS_SHORT, {
    variables: {
      userIds,
      painIds,
      druguseIds,
      pressureIds
    }
  });
  
  // Fill listEntities with data, taking into account the entity type
  const names = ["User", "Paincase", "Druguse", "Pressure"];
  if (data) {
    listEntities = [];
    names.forEach((name) => {
      let key;
      name === "User"
        ? key = "users"
        : name === "Paincase"
          ? key = "paincases"
          : name === "Druguse"
            ? key = "druguses"
            : key = "pressures";
      let id;
      name === "User"
        ? id = "telegramId"
        : id = "id";
      if (data[key]) {
        data[key].forEach((item) => {
          const entity: DraggableEntity = {
            name,
            id: item[id],
            shortViewData: item,
          }
          listEntities.push(entity);
        });
      }
    });
  }
  
  if (!data) {
    listEntities.push({name: "", id: 0})
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
          <CardHeader entityName={name} entityId={id} left={name}/>
          <Divider/>
          {/*{loadingState ? <Typography>{loadingState}</Typography> : null}*/}
          <List>
          {
            listEntities.map((entity: DraggableEntity, i) => {
                if (entity.name.includes("Paincase")) {
                  return (
                    <PaincaseView entity={entity} short={true} key={`PC_${entity.id}`}/>
                  )} else if (entity.name.includes("Druguse")) {
                  return (
                    <DruguseView entity={entity} short={true} key={`DU_${entity.id}`}/>
                  )} else if (entity.name.includes("Pressure")) {
                  return (
                    <PressureView entity={entity} short={true} key={`P_${entity.id}`}/>
                  )} else if (entity.name.includes("User")) {
                  return (
                    <UserView entity={entity} short={true} key={entity.id}/>
                  )} else if (entity.name.includes("List")) {
                  return (
                    <ListView entity={entity} key={entity.id}/>
                  )} else {
                  return (
                    <Typography key={`unknown_${i}`}>Loading...</Typography>
                  )
                }
              }
            )
          }
          </List>
        </CardContent>
      </Card>
    </Draggable>
  );
};