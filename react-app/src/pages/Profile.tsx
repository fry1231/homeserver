import {Button, Divider, Typography} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {setUser} from "../reducers/users";
import {useDispatch, useSelector} from "react-redux";
import {setAuthToken, clearAuthToken} from "../reducers/auth";
import {getAxiosClient} from "../misc/AxiosInstance";
import {jwtDecode} from "jwt-decode";
import {setErrorMessage} from "../reducers/errors";
import {JwtPayload} from "jwt-decode/build/esm";


interface TokenPayload extends JwtPayload {
  scopes: string[];
  exp: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const {token} = useSelector((state) => state.auth)
  const {currentUser} = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const axiosClient = getAxiosClient();
  
  // Get current user in /users/me
  useEffect(() => {
    axiosClient.get('/users/me')
      .then((response) => {
        dispatch(setUser(response.data));
      })
  }, []);
  
  let decodedToken: TokenPayload;
  try{
    decodedToken = jwtDecode<TokenPayload>(token);
  }
  catch(error){
    dispatch(setErrorMessage('Could not decode token'));
  }
  
  const expirationTime = new Date(decodedToken.exp * 1000);
  
  return (
    <>
      <Typography variant="h3">Profile</Typography>
      { currentUser && (
        <>
          <Typography variant="h5">Username: {currentUser.username}</Typography>
          <Typography variant="h5">Email: {currentUser.email}</Typography>
          <Typography variant="h5">Scopes: {currentUser.scopes}</Typography>
          <Typography variant="h5">UUID: {currentUser.uuid}</Typography>
          <Divider/>
          <Typography variant="h5">Access token expires: {expirationTime.toLocaleString()}</Typography>
          <Button variant="contained" color="secondary" onClick={() => {
            // refresh access token using refresh token
            axiosClient.get('/auth/refresh', {withCredentials: true})
              .then((response) => {
                dispatch(setAuthToken(response.data.access_token));
              })
              .catch((error) => {
                dispatch(setErrorMessage('Could not refresh token'));
              });
          }}>Refresh Token</Button>
          <Divider/>
          <Button variant="contained" color="error" onClick={() => {
            dispatch(clearAuthToken());
            navigate("/login");
          }}>Logout</Button>
        </>
      )}
    </>
  );
};