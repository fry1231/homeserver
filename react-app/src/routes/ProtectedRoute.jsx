import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../misc/authProvider.jsx";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

export const ProtectedRoute = () => {
    const {token, setToken} = useAuth();
    // Check if the user is authenticated
    if (!token) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login"/>;
    }
    // Check if token is expired
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    if (decodedToken.exp < currentTime) {
        setToken(null);
        return <Navigate to="/login"/>;
    }


    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    // If authenticated, render the child routes
    return <Outlet/>;
};