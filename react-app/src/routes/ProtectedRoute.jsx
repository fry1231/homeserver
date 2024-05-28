import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../misc/authProvider.jsx";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import {useError} from "../misc/ErrorHandling";


export const ProtectedRoute = () => {
    const {token, setToken} = useAuth();
    const {setError} = useError();

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

    // If user is not admin - display an error
    if (!decodedToken.isAdmin) {
        setError("You may not have the necessary permissions to access the content of this page.");
    }

    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    // If authenticated, render the child routes
    return <Outlet/>;
};