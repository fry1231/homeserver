import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import {getAxiosClient} from "../misc/AxiosInstance";
import {useState, useEffect} from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import {Tooltip} from "@mui/material";
import {useError} from "../misc/ErrorHandling";


export default function SignUp() {
  const {setErrorMessage} = useError();
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [valid, setValid] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const axios = getAxiosClient();
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // submit data
    axios.post('/users/signup', data, {timeout: 5000})
      .catch((error) => {
        console.log(error);
        if (error.response)
          setErrorMessage(error.response.data.detail);
        else
          setErrorMessage(error.message);
      });
  };
  
  const checkUsernameValidity = async (username: string) => {
    try {
      const response = await axios.get(`/users/check-username?username=${username}`);
      const data: {valid, message} = response.data;
      
      if (data.valid) {
        // Username is valid
        setValid(true);
      } else {
        // Username is not valid
        setValidationError(data.message)
        setValid(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setValidationError('Server error. Please try again later.')
    } finally {
      setLoading(false);
    }
  };
  
  // Check username validity when the username changes
  useEffect(() => {
    if (timer) {
      clearTimeout(timer);
    }
    
    if (username) {
      setLoading(true);
      setTimer(setTimeout(() => {
        checkUsernameValidity(username);
      }, 1000));
    }
  }, [username]);
  
  return (
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{m: 1, bgcolor: 'secondary.main'}}>
            <LockOutlinedIcon/>
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 3}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="username"
                  name="username"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  autoFocus
                  onChange={(e) => setUsername(e.target.value)}
                  InputProps={{
                    endAdornment:
                      loading
                      ? <CircularProgress color="secondary" size={20}/>
                      : valid
                        ? <CheckCircleIcon color="success"/>
                        : username.length === 0
                          ? null
                          : <Tooltip title={validationError}>
                              <CancelIcon color="error" aria-hidden={undefined}/>
                            </Tooltip>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{mt: 3, mb: 2}}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/signup" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
  );
}