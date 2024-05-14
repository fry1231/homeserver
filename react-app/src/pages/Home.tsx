import BusArrivals from "../components/BusArrivals";
import {Grid} from "@mui/material";

export default function Home() {
  return (
    <Grid container spacing={2}>
      <BusArrivals/>
    </Grid>
  );
};
