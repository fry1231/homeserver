import {Box, Button, IconButton, useTheme} from "@mui/material";
import {useContext} from "react";
import {ColorModeContext, tokens} from "../../theme.ts";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from "@mui/icons-material/Search";
import Typography from '@mui/material/Typography';
import {Link} from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import {useDispatch} from "react-redux";
import {closeAllWindows} from "../../reducers/positions";


const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const dispatch = useDispatch();
  
  const menuItem = (text: string, link: string) => {
    return (
      <MenuItem key={link} component={Link} to={link} onClick={() => dispatch(closeAllWindows())} >
        {link === '/' ? <HomeIcon/>
          : <Typography variant="h5" color={colors.grey[100]}>
              {text}
            </Typography>
        }
      </MenuItem>
    );
  }
  const links = {
    Home: '/',
    States: '/states',
    Buses: '/buses',
    Logs: '/logs',
    Statistics: '/statistics',
  }
  const menuItems = [];
  for (const [text, link] of Object.entries(links)) {
    menuItems.push(menuItem(text, link));
  }
  
  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* SECTIONS BAR */}
      <Box
        display="flex"
        alignItems="left"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
      >
        {menuItems}
      </Box>

      {/* ICONS */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon/>
          ) : (
            <LightModeOutlinedIcon/>
          )}
        </IconButton>
        <IconButton>
          <NotificationsOutlinedIcon/>
        </IconButton>
        <IconButton>
          <SettingsOutlinedIcon/>
        </IconButton>
        <IconButton component={Link} to="/profile">
          <PersonOutlinedIcon/>
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;