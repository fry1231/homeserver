import BusArrivals from "../components/BusArrivals";
import {Box, Button, Grid} from "@mui/material";
import Logs from "../components/Logs";
import Map from "../components/Map";
import {useError} from "../misc/ErrorHandling";

export default function Home() {
  const {setErrorMessage} = useError();
  return (
    <Grid container spacing={2}>
      <Button variant="contained" color="primary"
      onClick={() => setErrorMessage('Primary button clicked')}
      >Primary</Button>
      <BusArrivals/>
      <Box width={800} height={100}>
        {/*<Logs logLevels={['WARNING', 'INFO', 'ERROR']}/>*/}
      </Box>
    </Grid>
  );
};
