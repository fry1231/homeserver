import BusArrivals from "../components/PageMain/BusArrivals";
import Weather from "../components/PageMain/Weather";

export default function Home() {
  return (
    <>
      <Weather/>
      <BusArrivals/>
    </>
    // <Grid container spacing={2}>
    //
    //   {/*<Button variant="contained" color="primary"*/}
    //   {/*onClick={() => dispatch(setWarningMessage('Primary button clicked'))}*/}
    //   {/*>Primary</Button>*/}
    //   {/*<Button variant="contained" color="secondary"*/}
    //   {/*onClick={() => dispatch(setErrorMessage('Secondary button clicked'))}*/}
    //   {/*>Primary</Button>*/}
    //
    //   <Box width={800} height={100}>
    //     {/*<Logs logLevels={['WARNING', 'INFO', 'ERROR']}/>*/}
    //
    //   </Box>
    // </Grid>
  );
};
