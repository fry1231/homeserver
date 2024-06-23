import {useState} from 'react';
import {TextField, Button, Grid, Typography, Container} from '@mui/material';


const IrrigationTimer = () => {
  const [seconds, setSeconds] = useState('');
  
  const handleButtonClick = (value) => {
    setSeconds(value);
  };
  
  const handleInputChange = (event) => {
    setSeconds(event.target.value);
  };
  
  const handleSubmit = () => {
    // Handle the submit logic, such as sending the time to the server or another component
    console.log(`Irrigation time set to ${seconds} seconds`);
  };
  
  return (
    <Container>
      <Typography variant="h4" gutterBottom align="center">
        Set Irrigation Timer
      </Typography>
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Enter seconds"
            variant="outlined"
            value={seconds}
            onChange={handleInputChange}
            type="number"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Grid container spacing={2} justifyContent="center">
            {[5, 10, 15].map((value) => (
              <Grid item key={value}>
                <Button variant="contained" onClick={() => handleButtonClick(value)}>
                  {value} seconds
                </Button>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
          >
            Set Timer
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default IrrigationTimer;