import {useDispatch, useSelector} from "react-redux";
import {changeWindowPos, addWindow, DraggableEntity} from "../../reducers/draggables";
import {PaincaseProps, PaincaseView} from "../views/PaincaseView";
import {DruguseProps, DruguseView} from "../views/DruguseView";
import {PressureProps, PressureView} from "../views/PressureView";
import {UserProps, UserView} from "../views/UserView";
import {ListView} from "../views/ListView";
import {MapView} from "../views/MapView";
import {CardHeader} from "../common/CardHeader";
import Draggable from "react-draggable";
import {Card, CardContent, Divider, useTheme} from "@mui/material";
import {tokens} from "../../theme";


export default function DraggableContainer() {
  const statePositions = useSelector((state) => state.positions);
  const entities = statePositions.entities;
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <div style={{position: "relative"}}>
      {entities.map((entity: DraggableEntity, i) => {
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
            <Card sx={{
              position: "absolute",
              zIndex: entity.pos?.z,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: '5px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)',
              maxWidth: '95vw',
              // minWidth: '300px',
              // width: '300px',
              height: 'auto',
            }}>
              <CardContent>
                <CardHeader entityName={entity.name} entityId={entity.id} left={entity.name}/>
                <Divider/>
                {(() => {
                  switch (entity.name) {
                    case "Paincase":
                      return <PaincaseView entity={entity} key={i}/>;
                    case "Druguse":
                      return <DruguseView entity={entity} key={i}/>;
                    case "Pressure":
                      return <PressureView entity={entity} key={i}/>;
                    case "User":
                      return <UserView entity={entity} key={i}/>;
                    case "List":
                      return <ListView entity={entity} key={i}/>;
                    case "Map":
                      return <MapView entity={entity} key={i}/>;
                    default:
                      return <div key={i}>Unknown entity</div>;
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