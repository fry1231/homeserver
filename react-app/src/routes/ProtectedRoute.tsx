import {Navigate, Outlet} from "react-router-dom";
import {clearToken} from "../reducers/auth";
import {useSelector, useDispatch} from "react-redux";
import {setToken} from "../reducers/auth";
import {refreshAccessToken, getAxiosClient} from "../misc/AxiosInstance";
import {jwtDecode} from "jwt-decode";


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


export const TokenCookieToStorage = () => {
    const access_token = getCookie("access_token");
    if (!access_token) {
        console.log("No access token found in cookies");
        return <Navigate to="/"/>;
    }
    localStorage.setItem("token", access_token);
    console.log("Token stored in local storage: ", localStorage.getItem("token"));
    return <Navigate to="/"/>;
}


export const ProtectedRoute = () => {
    const {token} = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const axiosClient = getAxiosClient();

    // Check if the user is authenticated
    if (!token) {
        return <Navigate to="/login"/>;
    }
    
    // Check if token is expired
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    // If so, try to refresh the token using the refresh token cookie
    if (decodedToken.exp < currentTime) {
        const refreshToken = async () => {
            try {
                const newToken = await refreshAccessToken(axiosClient);
                dispatch(setToken(newToken));
            } catch (error) {
                console.error("ProtectedRoute error: ", error);
                return <Navigate to="/login"/>;
            }
        }
        refreshToken();
    }
    
    // If authenticated, render the child routes
    return <Outlet/>;
};