import Draggable from "react-draggable";
import {changeWindowPos} from "../../reducers/draggables";
import {CardHeader} from "../common/CardHeader";
import {useDispatch} from "react-redux";
import {tokens} from "../../theme";

export const CustomView = ({entity}) => {
  const dispatch = useDispatch();
  const name = entity.name;
  const id = entity.id;
  const props = entity.props;
  const pos = entity.pos;
  
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
        
          <CardHeader entityName={name} left={`Druguse #${props.id}`} center={props.date}/>
          <Divider/>
        
          <Typography ml={2} variant="body2" component="p">
            {props.drugname}: {props.amount} (mg)
          </Typography>
      
        </CardContent>
      </Card>
    </Draggable>
  );
};