import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {getAxiosClient} from "./AxiosInstance";

const AuthContext = createContext<any>(null);

const AuthProvider = ({children}) => {
    const axiosClient = getAxiosClient();
    const [token, setToken] = useState(localStorage.getItem("token"));

    useEffect(() => {
        if (token && axiosClient) {
            console.log('setting token', token)
            localStorage.setItem('token', token);
            axiosClient.defaults.headers.common["Authorization"] = "Bearer " + token;
        } else if (axiosClient) {
            localStorage.removeItem('token')
            delete axiosClient.defaults.headers.common["Authorization"];
        }
    }, [token, axiosClient]);

    const contextValue = useMemo(
        () => ({
            token,
            setToken,
            axiosClient
        }),
        [token, axiosClient]
    );

    return (
        <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;




// // import axios from "./AxiosInstance";
// import axiosBase from "axios";
// import {useError} from './ErrorHandling';
// import {createContext, useContext, useEffect, useMemo, useState} from "react";
//
//
// const AuthContext = createContext();
//
// const {setErrorMessage} = useError();
// const protocol = import.meta.env.VITE_REACT_APP_IN_PRODUCTION ? 'https' : 'http';
// const axiosClient = axiosBase.create({
//     baseURL: `${protocol}://${import.meta.env.VITE_REACT_APP_HOST}`,
//     timeout: 2000,
// });
// axiosClient.interceptors.request.use(function (config) {
//     console.log('request', config);
//     return config;
// }, function (error) {
//     console.error('error request', error);
// });
//
// axiosClient.interceptors.response.use(function (response) {
//     return response;
// }, function (error) {
//     console.log('error response', error);
//     const parsedError = JSON.parse(error.response.data);
//     setErrorMessage(parsedError.detail);
// });
//
//
// const AuthProvider = ({children}) => {
//     // State to hold the authentication token
//     const [token, setToken_] = useState(localStorage.getItem("token"));
//
//     // Function to set the authentication token
//     const setToken = (newToken) => {
//         setToken_(newToken);
//     };
//
//     // Axios instance
//
//
//     useEffect(() => {
//         if (token) {
//             axiosClient.defaults.headers.common["Authorization"] = "Bearer " + token;
//             localStorage.setItem('token', token);
//         } else {
//             delete axiosClient.defaults.headers.common["Authorization"];
//             localStorage.removeItem('token')
//         }
//     }, [token]);
//
//     // Memoized value of the authentication context
//     const contextValue = useMemo(
//         () => ({
//             token,
//             setToken,
//             axiosClient
//         }),
//         [token, axiosClient]
//     );
//
//     // Provide the authentication context to the children components
//     return (
//         <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
//     );
// };
//
// export const useAuth = () => {
//     return useContext(AuthContext);
// };
//
// export default AuthProvider;