import {IconButton, Paper, Typography} from "@mui/material";
import {GET_DETAILED_STATISTICS_BETWEEN_DATES, GET_SUM_STATISTICS_BETWEEN_DATES} from "../misc/gqlQueries";
import {ApolloError, useQuery} from "@apollo/client";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {addWindow} from "../reducers/draggables";
import {useDispatch, useSelector} from "react-redux";


interface UserProps {
  telegramId: string;
  firstName: string;
  lastName: string;
  userName: string;
}

interface IdDate {
  id: string;
  date: string;
}

interface IdDatetime {
  id: string;
  datetime: string;
}

interface DetailedStatisticsReportProps {
  newUsers: UserProps[];
  deletedUsers: UserProps[];
  superActiveUsers: UserProps[];
  paincases: IdDate[];
  druguses: IdDate[];
  pressures: IdDatetime[];
}

interface QueryResult {
  loading: boolean;
  error: ApolloError | undefined;
  data: {statistics: DetailedStatisticsReportProps} | undefined;
}

//export interface DraggableEntity {
//   name: string;   // "Paincase", "Druguse", "Pressure", "User", "List", "Custom"
//   id: number;  // id of the DB entry | telegramId for User | n for List & Custom
//   pos?: {x: number, y: number, z: number};   // null if new window
//   nestedContent?: DraggableEntity[];    // Used for List
//   shortViewData?: any;
// }

//  ISO8601 date format
export const StatisticsReport = ({afterDate, beforeDate}) => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.positions);
  const result: QueryResult = useQuery(GET_DETAILED_STATISTICS_BETWEEN_DATES, {
    variables: {afterDate, beforeDate}
  });
  const {loading, error, data} = result;
  const handleClick = () => {
    alert("This is a placeholder for the error message");
  }
  return (
    <Paper elevation={3}>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <Typography>New users: {data.statistics.newUsers.length} <IconButton onClick={() => {
            dispatch(addWindow({name: "List", id: state.n, nestedContent: data.statistics.newUsers}))
          }}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Deleted users: {data.statistics.deletedUsers.length} <IconButton onClick={handleClick}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Active users: {data.statistics.superActiveUsers.length} <IconButton onClick={handleClick}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Paincases: {data.statistics.paincases.length} <IconButton onClick={handleClick}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Druguses: {data.statistics.druguses.length} <IconButton onClick={handleClick}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Pressures: {data.statistics.pressures.length} <IconButton onClick={handleClick}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
        </div>
      )}
    </Paper>
  );
};