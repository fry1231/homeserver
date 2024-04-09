import {createSlice} from "@reduxjs/toolkit";
import {PaincaseProps} from "../components/views/PaincaseView";
import {DruguseProps} from "../components/views/DruguseView";
import {PressureProps} from "../components/views/PressureView";
import {UserProps} from "../components/views/UserView";
import {ListViewProps} from "../components/views/ListView";
import {isPaincaseProps, isDruguseProps, isPressureProps, isUserProps} from "../components/global/DraggableContainer";


export interface DraggableEntity {
  name: string;
  id: number;
  pos: {x: number, y: number};
  props: PaincaseProps | DruguseProps | PressureProps | UserProps | ListViewProps;
}

interface payloadPosChanged {
  name: string;
  pos: {x: number, y: number};
}

const initialState = {
  lastPosition: {
    x: 0,
    y: 0,
    z: 2,
  },
  entities: [] as DraggableEntity[],
  n: 0,    // with each new window, n is incremented
  maxZ: 2  // with each dragStart
};

const slice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    
    changeWindowPos(state, action) {
      const payload: payloadPosChanged = action.payload;
      const windowIndex = state.entities.findIndex((w) => w.name === payload.name);
      const newZ = state.maxZ + 1;
      const newPos = {...payload.pos, z: newZ};
      if (windowIndex !== -1) {
        state.entities[windowIndex].pos = newPos;
        state.lastPosition = newPos;
        state.maxZ = newZ;
      }
    },
    
    addWindow(state, action) {
      const payload: PaincaseProps
        | DruguseProps
        | PressureProps
        | UserProps
        | ListViewProps = action.payload;
      const entityName =
        isPaincaseProps(payload)
          ? 'Paincase'
          : isDruguseProps(payload)
            ? 'Druguse'
            : isPressureProps(payload)
              ? 'Pressure'
              : isUserProps(payload)
                ? 'User'
                : 'List';
      const lastPosition = state.lastPosition;
      const lastN = state.n;
      const maxZ = state.maxZ;
      const newZ = maxZ + 1;
      const newPosition = {x: lastPosition.x + 30, y: lastPosition.y + 30, z: newZ};
      const newN = lastN + 1;
      state.lastPosition = newPosition;
      state.n = newN;
      state.maxZ = newZ;
      const entityID =
        isPaincaseProps(payload) || isDruguseProps(payload) || isPressureProps(payload)
          ? payload.id
          : isUserProps(payload)
            ? payload.telegram_id
            : newN;
      const newEntity: DraggableEntity = {
        name: entityName,
        id: entityID,
        pos: newPosition,
        props: payload
      }
      state.entities.push(newEntity);
    },
    
    closeWindow(state, action) {
      const name: string = action.payload;
      state.entities = state.entities.filter((w) => w.name !== name);
      if (state.entities.length === 0) {
        state.lastPosition = {x: 0, y: 0, z: 2};
        state.n = 0;
        state.maxZ = 2;
      }
    },
    
    closeAllWindows(state) {
      state.entities = [];
      state.lastPosition = {x: 0, y: 0, z: 2};
      state.n = 0;
      state.maxZ = 2;
    }
  }
});

export const {changeWindowPos, addWindow, closeWindow, closeAllWindows} = slice.actions;

export default slice.reducer;