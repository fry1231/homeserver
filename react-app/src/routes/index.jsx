import {RouterProvider, createBrowserRouter, useRoutes} from "react-router-dom";
import {useAuth} from "../misc/authProvider.tsx";
import {ProtectedRoute, TokenCookieToStorage} from "./ProtectedRoute";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import Farm from "../pages/Farm";
import Statistics from "../pages/Statistics";
import Profile from "../components/Profile";
import LogIn from "../components/LogIn";
import SignUp from "../components/SignUp";
import Topbar from "../components/global/Topbar";
import States from "../pages/States";
import Logs from "../components/Logs";

import DraggableContainer from "../components/global/DraggableContainer";


const Routes = () => {
    const {token} = useAuth();

    // Define public routes accessible to all users
    const routesForPublic = [
        // {
        //     path: "/set-token",
        //     element: <TokenCookieToStorage />,
        // }
    ];

    // Define routes accessible only to authenticated users
    const routesForAuthenticatedOnly = [
        {
            path: "/",
            element: <ProtectedRoute/>, // Wrap the component in ProtectedRoute
            children: [
                {
                    path: "/",
                    element: <Home />,
                },
                {
                    path: "/profile",
                    element: <Profile />,
                },
                {
                    path: "/states",
                    element: <States />,
                },
                {
                    path: "/logs",
                    element: <Logs />,
                },
                {
                    path: "/farm",
                    element: <Farm />,
                },
                {
                    path: "/statistics",
                    element: <Statistics />,
                },
            ],
        },
    ];

    // Define routes accessible only to non-authenticated users
    const routesForNotAuthenticatedOnly = [
        {
            path: "/login",
            element: <LogIn />,
        },
        {
            path: "/signup",
            element: <SignUp />,
        },
        {
            path: "/set-token",
            element: <TokenCookieToStorage />,
        }
    ];

    const routeNotFound = {
        path: "*",
        element: <NotFound />,
    }

    // Combine and conditionally include routes based on authentication status
    // const router = createBrowserRouter([
    //     ...routesForPublic,
    //     ...(!token ? routesForNotAuthenticatedOnly : []),
    //     ...routesForAuthenticatedOnly,
    // ]);

    let routes = [
        ...routesForPublic,
        ...(!token ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly
    ];

    // Conditionally render Topbar if not /login or 404 page
    const availablePaths = routes.reduce((acc, curr) => {
        return curr.children ? acc.concat(curr.children.map(child => child.path)) : acc.concat(curr.path);
    }, []);
    const currentPath = window.location.pathname;
    const showTopbar = routesForNotAuthenticatedOnly.every(route => route.path !== currentPath)
        && availablePaths.includes(currentPath);

    routes = [...routes, routeNotFound];

    return (
        <div style={{ position: 'absolute'}}>
            {showTopbar && <Topbar/>}
            <DraggableContainer />
                {useRoutes(routes)}
        </div>
    )
};

export default Routes;