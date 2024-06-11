import {Button, Divider, Typography} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../misc/authProvider";
import {useEffect, useState} from "react";
import {setUser} from "../reducers/users";
import {useDispatch, useSelector} from "react-redux";
import {getAxiosClient} from "../misc/AxiosInstance";
import {jwtDecode} from "jwt-decode";


export default function Profile() {
  const {token, setToken} = useAuth();
  const navigate = useNavigate();
  const state = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const axiosClient = getAxiosClient();
  
  // Get current user in /users/me
  useEffect(() => {
    
    axiosClient.get('/users/me')
      .then((response) => {
        dispatch(setUser(response.data));
      })
      .catch((error) => {
        console.log(error);
      }
    );
  }, []);
  
  const decodedToken = jwtDecode(token);
  const expirationTime = new Date(decodedToken.exp * 1000);
  
  return (
    <>
      <Typography variant="h3">Profile</Typography>
      { state.currentUser && (
        <>
          <Typography variant="h5">Username: {state.currentUser.username}</Typography>
          <Typography variant="h5">Email: {state.currentUser.email}</Typography>
          <Typography variant="h5">Admin: {state.currentUser.is_admin ? "Yes" : "No"}</Typography>
          <Typography variant="h5">UUID: {state.currentUser.uuid}</Typography>
          <Divider/>
          <Typography variant="h5">Access token expires: {expirationTime.toLocaleString()}</Typography>
          <Button variant="contained" color="secondary" onClick={() => {
            // refresh access token using refresh token
            axiosClient.get('/auth/refresh')
              .then((response) => {
                setToken(response.data.access_token);
              })
          }}>Refresh Token</Button>
          <Divider/>
          <Button variant="contained" color="error" onClick={() => {
            setToken("");
            navigate("/login");
          }}>Logout</Button>
        </>
      )}
    </>
  );
};