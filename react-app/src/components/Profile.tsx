import axios from "../misc/AxiosInstance";
import {Button, Typography} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../misc/authProvider.jsx";
import {useEffect} from "react";
import {setUser} from "../reducers/users";
import {useDispatch, useSelector} from "react-redux";


export default function Profile() {
  const {token, setToken} = useAuth();
  const navigate = useNavigate();
  const state = useSelector((state) => state.users);
  const dispatch = useDispatch();
  
  // Get current user in /users/me
  useEffect(() => {
    axios.get('/users/me')
      .then((response) => {
        dispatch(setUser(response.data));
      })
      .catch((error) => {
        console.log(error);
      }
    );
  }, []);
  
  
  return (
    <>
      <Typography variant="h3">Profile</Typography>
      { state.currentUser && (
        <>
          <Typography variant="h5">Username: {state.currentUser.username}</Typography>
          <Typography variant="h5">Email: {state.currentUser.email}</Typography>
          <Typography variant="h5">Admin: {state.currentUser.is_admin ? "Yes" : "No"}</Typography>
          <Typography variant="h5">UUID: {state.currentUser.uuid}</Typography>
          <Button variant="contained" color="error" onClick={() => {
            setToken("");
            navigate("/login");
          }}>Logout</Button>
        </>
      )}
    </>
  );
};