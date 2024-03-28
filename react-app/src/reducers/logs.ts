import {createSlice} from "@reduxjs/toolkit";

const initialState: logs = {
  log_records: [],
  log_incr_value: -1
}

export interface logsUpdate {
  log_record: string;
  log_incr_value: number;
}

export interface logs {
  log_records: string[];
  log_incr_value: number;
}

const slice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    logsRefreshed(state, action) {
      // Update the state with the new log data
      state.log_incr_value = action.payload.log_incr_value;
      state.log_records = state.log_records.concat(action.payload.log_records);
    },
    logUpdateRecieved(state, action) {
      // Update the log with the new log record
      const logUpdate: logsUpdate = action.payload;
      state.log_incr_value = logUpdate.log_incr_value;
      state.log_records.unshift(logUpdate.log_record);
    },
    clearLogs(state) {
      // Clear the logs on unmount
      state.log_records = [];
      state.log_incr_value = -1;
    }
  }
});

export const { logsRefreshed, logUpdateRecieved, clearLogs } = slice.actions;
export default slice.reducer;
