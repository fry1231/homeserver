import {Navigate, Outlet} from "react-router-dom";
import {useSelector, useDispatch} from "react-redux";
import {refreshAuthToken, clearAuthToken, setAuthToken, AuthState} from "../reducers/auth";
import {setErrorMessage} from "../reducers/errors";
import {jwtDecode, JwtPayload} from "jwt-decode";
import {useEffect, useState} from "react";
import {store} from "../Store";


interface TokenPayload extends JwtPayload {
  scopes: string[];
}

/** Check if the token is expired or invalid
 *  Returns true if so */
const tokenExpiredOrInvalid = (token: string | null): boolean => {
  let decodedToken: TokenPayload;
  if (!token) {
    return true;
  }
  try {
    decodedToken = jwtDecode<TokenPayload>(token);
  } catch (error) {
    if (error instanceof Error && error.name === 'InvalidTokenError') {
      return true;
    }
  }
  const currentTime = Date.now() / 1000; // Convert to seconds
  console.log('Token is outdated by ', decodedToken.exp - currentTime, ' seconds');
  return decodedToken.exp < currentTime;
}


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
  setTimeout(() => {
    return <Navigate to="/"/>;
  }, 100);
}


const ProtectedRoute = () => {
  console.log('ProtectedRoute');
  const {isFirstEntry, scopes} = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  let isRefreshing: boolean = false;
  
  if (isFirstEntry) {
    console.log('First entry, redirecting to login');
    return <Navigate to="/login"/>;
  }
  
  if (scopes.length === 0 && !isRefreshing) {
    console.log('No scopes found in token, scopes=', scopes);
    const getNewToken = async () => {
      try {
        console.log('Refreshing token in ProtectedRoute');
        isRefreshing = true;
        await dispatch(refreshAuthToken()).unwrap();
      } catch (error) {
        dispatch(clearAuthToken());
        dispatch(setErrorMessage('Could not refresh token. Please log in again.'));
        return <Navigate to="/login"/>;
      }
    }
    getNewToken();
  } else if (isRefreshing) {
    console.log('Token is refreshing');
  } else{
    console.log('Token is valid');
    isRefreshing = false;
    return <Outlet/>;
    }
};

export default ProtectedRoute;

// const tokenExpired = tokenExpiredOrInvalid(token);
// useEffect(() => {
//   if ((!token || tokenExpired) && !isRefreshing) {
//     dispatch(refreshAuthToken());
//   }
// }, [token, isRefreshing]);


// const ProtectedRoute = () => {
//   const dispatch = useDispatch();
//   let currentToken: string | null = store.getState().auth.token;
//   let isRefreshing: boolean = store.getState().auth.isRefreshing;
  
  
  
  // useEffect(() => {
  //   const checkTokenAndRefresh = async () => {
  //     if (!token || tokenExpiredOrInvalid(token)) {
  //       if (!isRefreshing) {
  //         try {
  //           await dispatch(refreshAuthToken()).unwrap();
  //         } catch (error) {
  //           dispatch(clearAuthToken());
  //           dispatch(setErrorMessage('Could not refresh token. Please log in again.'));
  //         }
  //       }
  //     }
  //     setLoading(false);
  //   };
  //
  //   checkTokenAndRefresh();
  // }, [dispatch, token, isRefreshing]);
  
  // if (loading || isRefreshing) {
  //   // You can show a loading spinner or a placeholder component here
  //   return <div>Loading...</div>;
  // }
  
  // if (!token) {
  //   return <Navigate to="/login"/>;
  // }
  
//   return <Outlet/>;
// };

// export default ProtectedRoute;