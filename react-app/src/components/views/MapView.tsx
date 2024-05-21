import {CardContent} from "@mui/material";
import {UserProps} from "./UserView";
import {Map, MarkerProps} from "../Map";
import {DraggableEntity} from "../../reducers/draggables";


export function MapView({entity}: {entity: DraggableEntity}) {
  const users = entity.nestedContent;
  // Array of userMarkers for the Map component
  const usersMarkers: MarkerProps[] = []
  if (users) {
    users.forEach((user: UserProps) => {
      let userName = ''
      if (user.firstName) {
        userName += user.firstName + ' '
      }
      if (user.lastName) {
        userName += user.lastName + ' '
      }
      if (user.userName) {
        userName += `(@${user.userName})`
      }
      usersMarkers.push({
        coords: [user.latitude, user.longitude],
        userName,
        telegramId: user.telegramId
      });
    });
  }
  
  return (
    <CardContent>
      <Map userMarkers={usersMarkers}/>
    </CardContent>
  )
}
