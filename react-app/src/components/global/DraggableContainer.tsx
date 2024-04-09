import {useDispatch, useSelector} from "react-redux";
import {changeWindowPos, addWindow, DraggableEntity} from "../../reducers/draggables";
import {PaincaseProps, PaincaseView} from "../views/PaincaseView";
import {DruguseProps, DruguseView} from "../views/DruguseView";
import {PressureProps, PressureView} from "../views/PressureView";
import {UserProps, UserView} from "../views/UserView";
import {ListViewProps, ListView} from "../views/ListView";


// Type guards
export function isPaincaseProps(obj: any): obj is PaincaseProps {
  return 'durability' in obj;
}

export function isDruguseProps(obj: any): obj is DruguseProps {
  return 'amount' in obj;
}

export function isPressureProps(obj: any): obj is PressureProps {
  return 'systolic' in obj;
}

export function isUserProps(obj: any): obj is UserProps {
  return 'joined' in obj;
}

export function isListViewProps(obj: any): obj is ListViewProps {
  return 'entities' in obj;
}


export default function DraggableContainer() {
  const statePositions = useSelector((state) => state.positions);
  const entities = statePositions.entities;
  
  return (
    <div style={{position: "relative"}}>
      {entities.map((entity: DraggableEntity) => {
        if (isPaincaseProps(entity.props)) {
          return (
            <PaincaseView entity={entity} key={entity.name}/>
          )} else if (isDruguseProps(entity.props)) {
          return (
            <DruguseView entity={entity} key={entity.name}/>
          )} else if (isPressureProps(entity.props)) {
          return (
            <PressureView entity={entity} key={entity.name}/>
          )} else if (isUserProps(entity.props)) {
          return (
            <UserView entity={entity} key={entity.name}/>
          )} else {
          return (
            <ListView entity={entity} key={entity.name}/>
          )}
        })
      }
    </div>
  );
};