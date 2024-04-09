import {PaincaseProps, PaincaseView} from "./PaincaseView";
import {DruguseProps, DruguseView} from "./DruguseView";
import {PressureProps, PressureView} from "./PressureView";
import {UserProps, UserView} from "./UserView";
import {Card, CardContent, Divider, List, Typography} from "@mui/material";
import {isPaincaseProps, isUserProps, isDruguseProps, isPressureProps} from "../global/DraggableContainer";
import Draggable from "react-draggable";
import {changeWindowPos} from "../../reducers/draggables";
import {useDispatch} from "react-redux";
import {tokens} from "../../theme";
import {useTheme} from "@mui/material";
import {CardHeader} from "../common/CardHeader";

export interface ListViewProps {
  entities: (PaincaseProps | DruguseProps | PressureProps | UserProps | string)[];
}

export const ListView = ({entity}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const name = entity.name;
  const props = entity.props;
  const pos = entity.pos;
  let listEntities = props.entities;
  
  // if all listEntites are strings:
  const allStrings = listEntities.every((entity) => typeof entity === "string");
  if (allStrings) {   // fetch entities with gql
  
  }
  
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
          <List>
          {
            listEntities.map((entity: PaincaseProps | DruguseProps | PressureProps | UserProps | string, i) => {
                if (isPaincaseProps(entity)) {
                  return (
                    <PaincaseView entity={entity} short={true} key={`PC_${entity.id}`}/>
                  )} else if (isDruguseProps(entity)) {
                  return (
                    <DruguseView entity={entity} short={true} key={`DU_${entity.id}`}/>
                  )} else if (isPressureProps(entity)) {
                  return (
                    <PressureView entity={entity} short={true} key={`P_${entity.id}`}/>
                  )} else if (isUserProps(entity)) {
                  return (
                    <UserView entity={entity} short={true} key={entity.telegram_id}/>
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