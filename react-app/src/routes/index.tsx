import {useRoutes} from "react-router-dom";
import ProtectedRoute, {TokenCookieToStorage} from "./ProtectedRoute";
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
import {store} from "../Store";


interface Route {
    path: string;
    element: JSX.Element;
    children?: Route[];
}

const Routes = () => {
    const token = store.getState().auth.token;

    // Define public routes accessible to all users
    const routesForPublic: Route[] = [
        {
            path: "/set-token",
            element: <TokenCookieToStorage />,
        }
    ];

    // Define routes accessible only to authenticated users
    const routesForAuthenticatedOnly: Route[] = [
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
    const routesForNotAuthenticatedOnly: Route[] = [
        {
            path: "/login",
            element: <LogIn />,
        },
        {
            path: "/signup",
            element: <SignUp />,
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

    let routes: Route[] = [
        ...routesForPublic,
        ...(!token ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly
    ];

    // Conditionally render Topbar if not /login or 404 page
    const availablePaths: string[] = routes.reduce((acc: string[], curr: Route) => {
        return curr.children ? acc.concat(curr.children.map(child => child.path)) : acc.concat(curr.path);
    }, []);
    const currentPath: string = window.location.pathname;
    const showTopbar: boolean = routesForNotAuthenticatedOnly.every(route => route.path !== currentPath)
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