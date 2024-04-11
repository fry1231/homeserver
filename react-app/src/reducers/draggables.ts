import {createSlice} from "@reduxjs/toolkit";


// Object that represents a draggable window with content
export interface DraggableEntity {
  name: string;   // "Paincase", "Druguse", "Pressure", "User", "List", "Custom"
  id: number;  // id of the DB entry | telegramId for User | n for List & Custom
  pos?: {x: number, y: number, z: number};   // null if new window
  nestedContent?: DraggableEntity[];    // Used for List
  shortViewData?: any;
}

interface payloadPosChanged {
  name: string;
  id: number;
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
      const windowIndex = state.entities.findIndex((w) => w.name === payload.name && w.id === payload.id);
      const newZ = state.maxZ + 1;
      const newPos = {...payload.pos, z: newZ};
      if (windowIndex !== -1) {
        state.entities[windowIndex].pos = newPos;
        state.lastPosition = newPos;
        state.maxZ = newZ;
      }
    },
    
    addWindow(state, action) {
      const newEntity: DraggableEntity = action.payload;
      state.lastPosition = {
        x: state.lastPosition.x + 30,
        y: state.lastPosition.y + 30,
        z: state.maxZ + 1
      };
      state.n += 1;
      state.maxZ += 1;
      state.entities.push({...newEntity, pos: state.lastPosition});
    },
    
    closeWindow(state, action) {
      const name: string = action.payload;
      state.entities = state.entities.filter((w) => w.name !== name && w.id !== action.payload.id);
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