import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../misc/authProvider";
import {jwtDecode} from "jwt-decode";


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


export const TokenCookieToStorage = () => {
    const access_token = getCookie("access_token");
    if (!access_token) {
        return <Navigate to="/"/>;
    }
    localStorage.setItem("token", access_token);
    console.log("Token stored in local storage: ", localStorage.getItem("token"));
    return <Navigate to="/"/>;
}


export const ProtectedRoute = () => {
    const {token, setToken} = useAuth();
    console.log("ProtectedRoute token: ", token)
    // Check if the user is authenticated
    if (!token) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login"/>;
    }

    // Check if token is expired
    const decodedToken = jwtDecode(token);
    console.log("ProtectedRoute decodedToken: ", decodedToken)
    const currentTime = Date.now() / 1000; // Convert to seconds
    if (decodedToken.exp < currentTime) {
        setToken(null);
        return <Navigate to="/login"/>;
    }
    
    // If authenticated, render the child routes
    return <Outlet/>;
};