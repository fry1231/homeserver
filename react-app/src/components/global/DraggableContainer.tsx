import {useDispatch, useSelector} from "react-redux";
import {changeWindowPos, addWindow, DraggableEntity} from "../../reducers/draggables";
import {PaincaseProps, PaincaseView} from "../views/PaincaseView";
import {DruguseProps, DruguseView} from "../views/DruguseView";
import {PressureProps, PressureView} from "../views/PressureView";
import {UserProps, UserView} from "../views/UserView";
import {ListView} from "../views/ListView";
import {CardHeader} from "../common/CardHeader";
import Draggable from "react-draggable";
import {Card, CardContent, Divider, useTheme} from "@mui/material";
import {tokens} from "../../theme";


// Type guards
// export function isPaincaseProps(obj: any): obj is PaincaseProps {
//   return 'durability' in obj;
// }
//
// export function isDruguseProps(obj: any): obj is DruguseProps {
//   return 'amount' in obj;
// }
//
// export function isPressureProps(obj: any): obj is PressureProps {
//   return 'systolic' in obj;
// }
//
// export function isUserProps(obj: any): obj is UserProps {
//   return 'joined' in obj;
// }
//
// export function isListViewProps(obj: any): obj is ListViewProps {
//   return 'entities' in obj;
// }


export default function DraggableContainer() {
  const statePositions = useSelector((state) => state.positions);
  const entities = statePositions.entities;
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <div style={{position: "relative"}}>
      {entities.map((entity: DraggableEntity) => {
        return (
          <Draggable
            // enableUserSelectHack={false}
            key={'_' + entity.name + entity.id}
            position={{x: entity.pos.x, y: entity.pos.y}}
            onStop={(event, data) => {
              dispatch(changeWindowPos({name: entity.name, id: entity.id, pos: {x: data.x, y: data.y}}))
            }}
            onStart={(event, data) => {
              dispatch(changeWindowPos({name: entity.name, id: entity.id, pos: {x: data.x, y: data.y}}))
            }}
            handle=".handle"
          >
            <Card style={{
              position: "absolute",
              zIndex: entity.pos.z,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: '5px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)'
            }}>
              <CardContent>
                <CardHeader entityName={entity.name} entityId={entity.id} left={entity.name}/>
                <Divider/>
                {(() => {
                  switch (entity.name) {
                    case "Paincase":
                      return <PaincaseView entity={entity} key={entity.name + entity.id}/>;
                    case "Druguse":
                      return <DruguseView entity={entity} key={entity.name + entity.id}/>;
                    case "Pressure":
                      return <PressureView entity={entity} key={entity.name + entity.id}/>;
                    case "User":
                      return <UserView entity={entity} key={entity.name + entity.id}/>;
                    case "List":
                      return <ListView entity={entity} key={entity.name + entity.id}/>;
                    default:
                      return <div key={entity.name + entity.id}>Unknown entity</div>;
                  }
                })()}
              </CardContent>
            </Card>
          </Draggable>
        )
      }
      
  )}
    </div>
  );
}