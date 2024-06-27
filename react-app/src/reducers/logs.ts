import {createSlice} from "@reduxjs/toolkit";


export interface ParsedLog {
  // hash: string;
  timeString: string;   // 15.03.2024_01:13:18
  logLevel: string;
  message: string;
  location: string;
}

export interface LogsState {
  log_records: ParsedLog[];
  log_incr_value: number;
}

export interface LogsUpdatePayload {
  log_record: string;
  log_incr_value: number;
}

export interface LogsPayload {
  log_records: string[];
  log_incr_value: number;
}

const initialState: LogsState = {
  log_records: [],
  log_incr_value: -1,
}


// function djb2Hash(str) {
//   let hash = 5381;
//   for (let i = 0; i < str.length; i++) {
//     hash = (hash * 33) ^ str.charCodeAt(i);
//   }
//   return hash >>> 0;
// }

// const parseLogRecord = (logRecord: string): ParsedLog => {
//   const [timeString, logLevel] = logRecord.split(' ', 2);
//   const messageAndLocation = logRecord.split(' ').slice(2).join(' ');
//   let message = messageAndLocation.split(' ').slice(0, -1).join(' ');
//   let location = messageAndLocation.split(' ').slice(-1)[0];
//   if (!location.startsWith('(')) {
//     message += ' ' + location;
//     location = '';
//   }
//   const hash = djb2Hash(logRecord);
//   return {hash, timeString, logLevel, message, location};
// }

// let logs: LogRecord[] = stateLocal.log_records.map((logRecord: string) => {
//   const [timeString, logLevel] = logRecord.split(' ', 2);
//   let messageAndLocation = logRecord.split(' ').slice(2).join(' ');
//   let message = messageAndLocation.split(' ').slice(0, -1).join(' ');
//   let location = messageAndLocation.split(' ').slice(-1)[0];
//   if (!location.startsWith('(')) {
//     message += ' ' + location;
//     location = '';
//   }
//   return {timeString, logLevel, message, location};
// });
//
// // Filter by log level
// if (logLevels)
//   logs = logs.filter((log) => logLevels.includes(log.logLevel.replace('[', '').replace(']', '')));
//
// // Sort by timeString descending
// logs.sort((a, b) => {
//   return new Date(a.timeString) > new Date(b.timeString) ? -1 : 1;
// });


const slice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    logsRefreshed(state, action) {
      // Update the state with the new log data
      const payload = action.payload as LogsPayload;
      state.log_incr_value = payload.log_incr_value;
      state.log_records = state.log_records.concat(payload.log_records);
    },
    logUpdateRecieved(state, action) {
      // Update the log with the new log record
      const logUpdate = action.payload as LogsUpdatePayload;
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
