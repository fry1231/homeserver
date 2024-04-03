import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../misc/authProvider.jsx";
import axios from "axios";


export const ProtectedRoute = () => {
    const {token} = useAuth();

    // Check if the user is authenticated
    if (!token) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login"/>;
    }
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    // If authenticated, render the child routes
    return <Outlet/>;
};