import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../misc/authProvider.jsx";
import axios from "../misc/AxiosInstance";
import {jwtDecode} from "jwt-decode";
import {useError} from "../misc/ErrorHandling";


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
    const {setErrorMessage} = useError();
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

    // If user is not admin - display an error
    // if (!decodedToken.isAdmin) {
    //     setErrorMessage("You may not have the necessary permissions to access the content of this page.");
    // }

    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    // If authenticated, render the child routes
    return <Outlet/>;
};