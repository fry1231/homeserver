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
import {useState} from "react";


// export interface ListViewProps {
//   entities: (PaincaseProps | DruguseProps | PressureProps | UserProps)[];
// }

export const ListView = ({entity}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const name = entity.name;
  const pos = entity.pos;
  const requiredEntities = entity.nestedContent;
  const userIds = [];
  const painIds = [];
  const druguseIds = [];
  const pressureIds = [];
  const listEntities = [];
  if (requiredEntities) {
    requiredEntities.forEach((entity) => {
      if (entity.name === "User") {
        userIds.push(entity.id);
      } else if (entity.name === "Paincase") {
        painIds.push(entity.id);
      } else if (entity.name === "Druguse") {
        druguseIds.push(entity.id);
      } else if (entity.name === "Pressure") {
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
  console.log(data);
  
  // Display loading state while fetching data
  // const [loadingState, setLoadingState] = useState("");
  // if (loading) setLoadingState("Loading...");
  // if (error) setLoadingState("Error loading data")
  // if (!data) setLoadingState("No data")
  console.log("Error", error);
  if (data) listEntities.push(...data.users, ...data.paincases, ...data.druguses, ...data.pressures);
  
  
  return (
    <Draggable
      // enableUserSelectHack={false}
      position={{x: pos.x, y: pos.y}}
      onStop={(event, data) => {
        dispatch(changeWindowPos({name, pos: {x: data.x, y: data.y}}))
      }}
      onStart={(event, data) => {
        dispatch(changeWindowPos({name, pos: {x: data.x, y: data.y}}))
      }}
      handle=".handle"
    >
      <Card style={{position: "absolute", zIndex: pos.z}}>
        <CardContent>
          <CardHeader entityName={name} left={name}/>
          <Divider/>
          {/*{loadingState ? <Typography>{loadingState}</Typography> : null}*/}
          <List>
          {
            listEntities.map((entity: DraggableEntity, i) => {
                if (entity.name === "Paincase") {
                  return (
                    <PaincaseView entity={entity} short={true} key={`PC_${entity.id}`}/>
                  )} else if (entity.name === "Druguse") {
                  return (
                    <DruguseView entity={entity} short={true} key={`DU_${entity.id}`}/>
                  )} else if (entity.name === "Pressure") {
                  return (
                    <PressureView entity={entity} short={true} key={`P_${entity.id}`}/>
                  )} else if (entity.name === "User") {
                  return (
                    <UserView entity={entity} short={true} key={entity.id}/>
                  )} else if (entity.name === "List") {
                  return (
                    <ListView entity={entity} key={entity.id}/>
                  )} else {
                  return (
                    <Typography key={`unknown_${i}`}>entity</Typography>
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