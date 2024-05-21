import BusArrivals from "../components/BusArrivals";
import {Box, Grid} from "@mui/material";
import Logs from "../components/Logs";
import Map from "../components/Map";

export default function Home() {
  return (
    <Grid container spacing={2}>
      <BusArrivals/>
      <Box width={800} height={100}>
        {/*<Logs logLevels={['WARNING', 'INFO', 'ERROR']}/>*/}
      </Box>
      <Box width={800} height={200}>
        <Map userMarkers={[]}/>
      </Box>
    </Grid>
  );
};
