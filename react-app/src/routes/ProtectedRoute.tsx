import {Navigate, Outlet} from "react-router-dom";
import {useSelector, useDispatch} from "react-redux";
import {setToken, clearToken, setIsRefreshing} from "../reducers/auth";
import {setErrorMessage} from "../reducers/errors";
import {getNewAcessToken, getAxiosClient} from "../misc/AxiosInstance";
import {jwtDecode} from "jwt-decode";
import {Typography} from "@mui/material";


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}


export const TokenCookieToStorage = () => {
  const dispatch = useDispatch();
  const access_token = getCookie("access_token");
  if (!access_token) {
    console.log("No access token found in cookies");
    dispatch(setErrorMessage("Could not authenticate via Google. Please try again."));
    return <Navigate to="/login"/>;
  }
  dispatch(setToken(access_token));
  console.log("Token stored in local storage: ", localStorage.getItem("token"));
  setTimeout(() => {
    return <Navigate to="/"/>;
  }, 100);
}


export const ProtectedRoute = () => {
  console.log('In protected route component')
  const {token, isRefreshing} = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const axiosClient = getAxiosClient();
  
  /** Check if the token is expired */
  const tokenExpired = (token: string): boolean => {
    let decodedToken;
    try {
      decodedToken = jwtDecode(token);
    } catch (error) {
      if (error.name === 'InvalidTokenError') {
        return true;
      }
    }
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decodedToken.exp < currentTime;
  }
  
  const refreshExpiredToken = async () => {
    console.log('refreshing in protected route')
    const newToken = await getNewAcessToken(axiosClient);
    dispatch(setToken(newToken));
  }
  
  // Check if the user is authenticated
  if (!token) {
    return <Navigate to="/login"/>;
  }
  
  // If not expired, render the child routes
  if (!tokenExpired(token)) {
    return <Outlet/>;
  }
  
  if (!isRefreshing) {
    refreshExpiredToken()
    .then(() => {
      dispatch(setIsRefreshing(false));
      return <Outlet/>;
    })
    .catch((error) => {
      // If refresh fails, redirect to login
      dispatch(clearToken());
      dispatch(setErrorMessage("Could not refresh token. Please log in again."));
      return <Navigate to="/login"/>;
    });
  }
};