import {createSlice} from "@reduxjs/toolkit";

const initialState: States = {
  states: [{
    state_name: "No data",
    user_ids: []
  }],
  incr_value: -1
}

export interface StateUpdate {
  user_id: number;
  user_state: string;
  action: "set" | "unset" | "refresh";
  incr_value: number;
}

export interface StateInstance {
  state_name: string;
  user_ids: number[];
}

export interface States {
  states: StateInstance[];
  incr_value: number;
}


const statesSlice = createSlice({
  name: 'states',
  initialState,
  reducers: {
    statesRefreshed(state, action) {
      // Update the state with the new state data
      state.incr_value = action.payload.incr_value;
      state.states = action.payload.states;
    },
    stateUpdateRecieved(state, action) {
      // Update the specified state with the user_id
      const stateUpdate: StateUpdate = action.payload;
      const currStatesDisposition = state.states;
      const currState = currStatesDisposition.find((el) => el.state_name === stateUpdate.user_state);
      if (currState) {
        if (stateUpdate.action === "set") {
          currState.user_ids.push(stateUpdate.user_id);
        } else
            if (stateUpdate.action === "unset") {
              const index = currState.user_ids.indexOf(stateUpdate.user_id);
              if (index > -1) currState.user_ids.splice(index, 1);
            }
        }
      // Increment incr_value
      state.incr_value = stateUpdate.incr_value;
      }
  }
});

export const {statesRefreshed, stateUpdateRecieved} = statesSlice.actions;

export default statesSlice.reducer;