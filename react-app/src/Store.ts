import {configureStore} from "@reduxjs/toolkit";
import busReducer from "./reducers/buses";
import stateReducer from "./reducers/states";
import usersReducer from "./reducers/users";
import logsReducer from "./reducers/logs";
import positionsReducer from "./reducers/draggables";
import authReducer from "./reducers/auth";
import errorsReducer from "./reducers/errors";


export const store = configureStore({
  reducer: {
    buses: busReducer,
    states: stateReducer,
    users: usersReducer,
    logs: logsReducer,
    positions: positionsReducer,
    auth: authReducer,
    errors: errorsReducer,
  },
  devTools: import.meta.env.VITE_REACT_APP_IN_PRODUCTION == '0',
});