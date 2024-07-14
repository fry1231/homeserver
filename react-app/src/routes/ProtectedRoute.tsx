import {Navigate, Outlet} from "react-router-dom";
import {useSelector, useDispatch} from "react-redux";
import {refreshAuthToken, clearAuthToken, setAuthToken, AuthState} from "../reducers/auth";
import {setErrorMessage} from "../reducers/errors";
import {jwtDecode, JwtPayload} from "jwt-decode";
import {getNewToken} from "../misc/utils";


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}


/** Store the access_token from cookies to local storage */
export const TokenCookieToStorage = () => {
  const dispatch = useDispatch();
  const access_token = getCookie("access_token");
  if (!access_token) {
    console.log("No access token found in cookies");
    dispatch(setErrorMessage("Could not authenticate via Google. Please try again."));
    return <Navigate to="/login"/>;
  }
  dispatch(setAuthToken(access_token));
  console.log("Token stored in local storage: ", localStorage.getItem("token"));
  // setTimeout(() => {
    return <Navigate to="/"/>;
  // }, 100);
}


const ProtectedRoute = () => {
  const {scopes} = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // On page refresh
  // if (isFirstEntry && storedToken && storedToken !== 'undefined') {
  //   console.log('First entry, but token found in local storage');
  //   dispatch(setAuthToken(storedToken));
  //   return <Outlet/>;
  // }
  //
  // if (isFirstEntry && !storedToken) {
  //   console.log('First entry, redirecting to login');
  //   return <Navigate to="/login"/>;
  // }
  
  // if (!storedToken) {
  //   console.log('No token found in local storage');
  //   return <Navigate to="/login"/>;
  // }
  
  if (scopes.length === 0) {
    try {
      console.log('Refreshing in ProtectedRoute')
      getNewToken()
        .then((newToken) => {
          return <Outlet/>;
        });
    } catch (error) {
      dispatch(clearAuthToken());
      dispatch(setErrorMessage('Could not refresh token. Please log in again.'));
      return <Navigate to="/login"/>;
    }
  }
  
  return <Outlet/>;
};

export default ProtectedRoute;