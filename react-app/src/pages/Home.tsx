import BusArrivals from "../components/PageMain/BusArrivals";
import {Box, Button, Grid} from "@mui/material";
import {useDispatch} from "react-redux";
import {setErrorMessage} from "../reducers/errors";

export default function Home() {
  const dispatch = useDispatch();
  return (
    <Grid container spacing={2}>
      <Button variant="contained" color="primary"
      onClick={() => dispatch(setErrorMessage('Primary button clicked'))}
      >Primary</Button>
      <Button variant="contained" color="secondary"
      onClick={() => dispatch(setErrorMessage('Secondary button clicked'))}
      >Primary</Button>
      <BusArrivals/>
      <Box width={800} height={100}>
        {/*<Logs logLevels={['WARNING', 'INFO', 'ERROR']}/>*/}
      </Box>
    </Grid>
  );
};
