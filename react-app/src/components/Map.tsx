import {MapContainer} from 'react-leaflet/MapContainer'
import {TileLayer} from 'react-leaflet/TileLayer'
import {useMap} from 'react-leaflet/hooks'
import {Marker, Popup} from "react-leaflet";
import {Box, Link, Typography} from "@mui/material";
import {addWindow} from "../reducers/draggables";
import {useDispatch} from "react-redux";
import {tokens} from "../theme";
import {useTheme} from "@mui/material";
import {useEffect, useRef} from "react";


export interface MarkerProps {
  coords: [number|null, number|null];
  userName: string;
  telegramId: number|string;
}

export function Map({userMarkers}: {userMarkers: MarkerProps[]}) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const boxRef = useRef();
  const colors = tokens(theme.palette.mode);
  // Found the center of all the coordinates
  const center = userMarkers.reduce((acc, marker) => {
      return [acc[0] + marker.coords[0], acc[1] + marker.coords[1]];
    }, [0, 0]);
  center[0] /= userMarkers.length;
  center[1] /= userMarkers.length;
  
  useEffect(() => {
    console.log(boxRef.current.getBoundingClientRect());
  }, [boxRef.current]);
  
  return (
    <Box width="60vw" height="50vh" ref={boxRef}>
      <MapContainer center={center} zoom={1} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userMarkers.map((user, i) => (
          <Marker key={i} position={user.coords}>
            <Popup>
              <Typography component="span">ID: {user.telegramId}</Typography>
              <br/>
              <Link color={colors.orangeAccent[500]} onClick={
                (e) => {
                  const rect = boxRef.current.getBoundingClientRect();
                  dispatch(addWindow({
                    name: "User",
                    id: user.telegramId,
                    pos: {
                      x: e.clientX + window.scrollX,
                      y: e.clientY + window.scrollY,
                    }
                  }))
                }
              }>{user.userName}</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}

export default Map;