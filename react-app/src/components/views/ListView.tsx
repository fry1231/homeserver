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
  error && console.error(error);
  // 5015185924 bigint check
  
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
  
  // Sort by date OR datetime (if exist) descending
  listEntities.sort((a, b) => {
    if (a.shortViewData?.date && b.shortViewData?.date) {
      return new Date(b.shortViewData.date) - new Date(a.shortViewData.date);
    } else if (a.shortViewData?.datetime && b.shortViewData?.datetime) {
      return new Date(b.shortViewData.datetime) - new Date(a.shortViewData.datetime);
    } else {
      return 0;
    }
  });
  
  return (
  
    <List>
      {
        listEntities.map((entity: DraggableEntity, i) => {
            if (entity.name.includes("Paincase")) {
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                  <Typography mr={1}>{i + 1}. </Typography>
                  <PaincaseView entity={entity} short={true} key={`PC_${entity.id}`}/>
                </div>
              )
            } else if (entity.name.includes("Druguse")) {
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                  <Typography mr={1}>{i + 1}. </Typography>
                  <DruguseView entity={entity} short={true} key={`DU_${entity.id}`}/>
                </div>
              )
            } else if (entity.name.includes("Pressure")) {
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                  <Typography mr={1}>{i + 1}. </Typography>
                  <PressureView entity={entity} short={true} key={`P_${entity.id}`}/>
                </div>
              )
            } else if (entity.name.includes("User")) {
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                  <Typography mr={1}>{i + 1}. </Typography>
                  <UserView entity={entity} short={true} key={entity.id}/>
                </div>
              )
            } else if (entity.name.includes("List")) {
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                  <Typography mr={1}>{i + 1}. </Typography>
                  <ListView entity={entity} key={entity.id}/>
                </div>
              )
            } else {
              return (
                <Typography key={`unknown_${i}`}>Loading...</Typography>
              )
            }
          }
        )
      }
    </List>
  );
};