import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {getAxiosClient} from "../misc/AxiosInstance";
import {useNavigate} from "react-router-dom";
import GoogleIcon from '@mui/icons-material/Google';
import TextField from "./global/CustomInputField"
import {useDispatch} from "react-redux";
import {setToken as setToken_} from "../reducers/auth";


export default function LogIn() {
  const dispatch = useDispatch();
  const setToken = (token: string) => dispatch(setToken_(token));
  const navigate = useNavigate();
  const axiosClient = getAxiosClient();
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    axiosClient.post('/auth/login/form', data, {timeout: 5000})
      .then((response) => {
        if (response.status === 200) {
          const token = response.data.access_token;
          setToken(token);
          navigate('/');
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
            {/*<FormControlLabel*/}
            {/*  control={<Checkbox value="remember" color="primary"/>}*/}
            {/*  label="Remember me"*/}
            {/*/>*/}
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