import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import axiosClient from "../misc/AxiosInstance";
import {useNavigate} from "react-router-dom";
import GoogleIcon from '@mui/icons-material/Google';
import TextField from '@mui/material/TextField';
import {useDispatch} from "react-redux";
import {setAuthToken} from "../reducers/auth";
import {setErrorMessage} from "../reducers/errors";


export default function LogIn() {
  const dispatch = useDispatch();
  const setToken = (token: string) => dispatch(setAuthToken(token));
  const navigate = useNavigate();
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    axiosClient.post('/auth/login/form', data, {timeout: 5000, withCredentials: true})
      .then((response) => {
        if (response.status === 200) {
          const token = response.data.access_token;
          setToken(token);
          navigate('/');
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          dispatch(setErrorMessage('Invalid username or password'));
        }
        else {
            dispatch(setErrorMessage('Server error'));
        }
      });
  }
  
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
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1}}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              enterKeyHint="next"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              enterKeyHint="go"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              sx={{mt: 3, mb: 2}}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href={`https://${import.meta.env.VITE_REACT_APP_HOST}/auth/login/google`} color="#fff"
                      variant="body2">
                  <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <GoogleIcon/>
                    <Typography ml={1}>Sign in with Google</Typography>
                  </Box>
                </Link>
              </Grid>
              <Grid item>
                <Link href="/signup" color="#fff" variant="body2">
                  Don't have an account? Sign Up
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
  );
}