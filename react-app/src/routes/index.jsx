import {RouterProvider, createBrowserRouter, useRoutes} from "react-router-dom";
import {useAuth} from "../misc/authProvider.jsx";
import {ProtectedRoute} from "./ProtectedRoute";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import Profile from "../components/Profile";
import SignIn from "../components/SignIn";
import Topbar from "../components/global/Topbar";
import BusArrivals from "../components/BusArrivals";
import StateView from "../components/views/StateView";
import Logs from "../components/Logs";
import Statistics from "../components/Statistics";
import Farm from "../components/Farm";
import DraggableContainer from "../components/global/DraggableContainer";


const Routes = () => {
    const {token} = useAuth();

    // Define public routes accessible to all users
    const routesForPublic = [
        // {
        //     path: "/service",
        //     element: <div>Service Page</div>,
        // },
        // {
        //     path: "/about-us",
        //     element: <div>About Us</div>,
        // },
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
                    path: "/buses",
                    element: <BusArrivals/>,
                },
                {
                    path: "/states",
                    element: <StateView />,
                },
                {
                    path: "/logs",
                    element: <Logs />,
                },
                {
                    path: "/farm",
                    element: <Farm />,
                },

            ],
        },
    ];

    // Define routes accessible only to non-authenticated users
    const routesForNotAuthenticatedOnly = [
        {
            path: "/login",
            element: <SignIn />,
        },
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
    const showTopbar = currentPath !== "/login" && availablePaths.includes(currentPath);

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