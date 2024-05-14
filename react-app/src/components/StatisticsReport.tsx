import {IconButton, LinearProgress, Paper, Typography} from "@mui/material";
import {GET_DETAILED_STATISTICS_BETWEEN, GET_SUM_STATISTICS_BETWEEN} from "../misc/gqlQueries";
import {ApolloError, useQuery} from "@apollo/client";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {addWindow} from "../reducers/draggables";
import {useDispatch, useSelector} from "react-redux";
// import useStyles from "./global/Flicker";

interface UserProps {
  name?: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  userName: string;
}

interface IdDate {
  name?: string;
  id: string;
  date: string;
}

interface IdDatetime {
  name?: string;
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
const StatisticsReport = ({afterDate, beforeDate}) => {
  // const {flicker, withAnimation} = useStyles();
  const dispatch = useDispatch();
  const state = useSelector((state) => state.positions);
  const result: QueryResult = useQuery(GET_DETAILED_STATISTICS_BETWEEN, {
    variables: {afterDate, beforeDate}
  });
  let {loading, error, data} = result;
  error && console.error(error);
  
  const newUsers = data ? data.statistics.newUsers.map(user => (
    {name: "User", id: user.telegramId, shortView: user})) : [];
  const deletedUsers = data ? data.statistics.deletedUsers.map(user => (
    {name: "User", id: user.telegramId, shortView: user})) : [];
  const superActiveUsers = data ? data.statistics.superActiveUsers.map(user => (
    {name: "User", id: user.telegramId, shortView: user})) : [];
  const paincases = data ? data.statistics.paincases.map(paincase => (
    {name: "Paincase", id: paincase.id, shortView: paincase})) : [];
  const druguses = data ? data.statistics.druguses.map(druguse => (
    {name: "Druguse", id: druguse.id, shortView: druguse})) : [];
  const pressures = data ? data.statistics.pressures.map(pressure => (
    {name: "Pressure", id: pressure.id, shortView: pressure})) : [];
  
  // if (loading) return <Paper elevation = {3}>Loading...</Paper>;
  
  return (
    <Paper elevation={3}>
      {
        loading
          ? <LinearProgress/>
          : null
      }
      {data && (
        // <div> className={`${flicker} ${withAnimation}`}>
        <div>
          <Typography>New users: {newUsers.length} <IconButton onClick={() => {
            dispatch(addWindow({name: "List", id: state.n, nestedContent: newUsers}))
          }}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Deleted users: {deletedUsers.length} <IconButton onClick={() => {
            dispatch(addWindow({name: "List", id: state.n, nestedContent: deletedUsers}))
          }}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Active users: {superActiveUsers.length} <IconButton onClick={() => {
            dispatch(addWindow({name: "List", id: state.n, nestedContent: superActiveUsers}))
          }}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Paincases: {paincases.length} <IconButton onClick={() => {
            dispatch(addWindow({name: "List", id: state.n, nestedContent: paincases}))
          }}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Druguses: {druguses.length} <IconButton onClick={() => {
            dispatch(addWindow({name: "List", id: state.n, nestedContent: druguses}))
          }}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
          <Typography>Pressures: {pressures.length} <IconButton onClick={() => {
            dispatch(addWindow({name: "List", id: state.n, nestedContent: pressures}))
          }}><ErrorOutlineIcon
            fontSize="small"/></IconButton></Typography>
        </div>
      )}
    </Paper>
  );
};

export default StatisticsReport;