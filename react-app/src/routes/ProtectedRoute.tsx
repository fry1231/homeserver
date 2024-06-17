import {Navigate, Outlet} from "react-router-dom";
import {useSelector, useDispatch} from "react-redux";
import {setToken} from "../reducers/auth";
import {setErrorMessage} from "../reducers/errors";
import {getNewAcessToken, getAxiosClient} from "../misc/AxiosInstance";
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
import {Typography} from "@mui/material";
import {useEffect, useState} from "react";


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


export const TokenCookieToStorage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const access_token = getCookie("access_token");
    if (!access_token) {
        console.log("No access token found in cookies");
        dispatch(setErrorMessage("Could not authenticate via Google. Please try again."));
        navigate("/login");
    }
    dispatch(setToken(access_token));
    console.log("Token stored in local storage: ", localStorage.getItem("token"));
    setTimeout(() => { // Redirect after 1 second
        navigate("/");
    }, 1000);
    return <Typography>Logged in, redirecting...</Typography>;
}


export const ProtectedRoute = () => {
    const {token, isRefreshing} = useSelector((state) => state.auth);
    const [isExpired, setIsExpired] = useState(false);
    const dispatch = useDispatch();
    const axiosClient = getAxiosClient();

    // Check if the user is authenticated
    if (!token) {
        return <Navigate to="/login"/>;
    }
    
    // Check if token is expired
    useEffect(() => {
        if (!isRefreshing) {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Convert to seconds
            if (decodedToken.exp < currentTime) {
                setIsExpired(true);
                const refreshToken = async () => {
                    try {
                        console.log('refreshing in protected route')
                        const newToken = await getNewAcessToken(axiosClient);
                        dispatch(setToken(newToken));
                        setIsExpired(false);
                    } catch (error) {
                        console.error("ProtectedRoute error: ", error);
                        return <Navigate to="/login"/>;
                    }
                }
                refreshToken();
            }}
            
        }, [token]);
    
    // If authenticated, render the child routes
    if (!isExpired) {
        return <Outlet/>;
    }
};