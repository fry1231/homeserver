import * as React from 'react';
import {useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import WindowIcon from '@mui/icons-material/Window';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import {useDispatch} from "react-redux";
import {clearAuthToken} from "../../reducers/auth";
import {ColorModeContext} from "../../theme";
import {useTheme} from "@mui/material";


const links = {
    States: '/states',
    Logs: '/logs',
    Farm: '/farm',
    Statistics: '/statistics',
    Monitoring: `https://dashboard.${import.meta.env.VITE_REACT_APP_DOMAIN}`,
}


function ResponsiveAppBar() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleMenuClick = (link) => {
        if (link.startsWith('http')) {
            window.open(link, '_blank');
        } else {
            navigate(link);
        }
        handleCloseNavMenu();
    }

    const openProfilePage = () => {
        setAnchorElUser(null);
        navigate('/profile');
    }

    const logOut = () => {
        setAnchorElUser(null);
        dispatch(clearAuthToken());
        navigate('/login');
    }

    const homeName = 'HOME';

    return (
        <AppBar position="static" color="primary" enableColorOnDark>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <WindowIcon sx={{display: {xs: 'none', md: 'flex'}, mr: 1}}/>
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        onClick={() => navigate('/')}
                        sx={{
                            mr: 2,
                            display: {xs: 'none', md: 'flex'},
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        {homeName}
                    </Typography>

                    <Box sx={{flexGrow: 1, display: {xs: 'flex', md: 'none'}}}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: {xs: 'block', md: 'none'},
                            }}
                        >
                            {Object.entries(links).map(([page, link]) => (
                                <MenuItem key={page} onClick={() => handleMenuClick(link)}>
                                    <Typography textAlign="center" component="a">{page}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                    <WindowIcon sx={{display: {xs: 'flex', md: 'none'}, mr: 1}}/>
                    <Typography
                        variant="h5"
                        noWrap
                        component="a"
                        onClick={() => navigate('/')}
                        sx={{
                            mr: 2,
                            display: {xs: 'flex', md: 'none'},
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        {homeName}
                    </Typography>

                    <Box sx={{flexGrow: 1, display: {xs: 'none', md: 'flex'}}}>
                        {Object.entries(links).map(([page, link]) => (
                            <Button key={page} onClick={() => handleMenuClick(link)} sx={{mx: 2, color: 'white'}}>
                                {page}
                            </Button>
                        ))}
                    </Box>


                    <Box sx={{flexGrow: 0}}>
                        <Tooltip title="Toggle light/dark theme">
                            <IconButton onClick={colorMode.toggleColorMode} sx={{p: 1}}>
                                {theme.palette.mode === 'dark' ? <LightModeOutlinedIcon/> :
                                    <DarkModeOutlinedIcon color="secondary"/>}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="User settings">
                            <IconButton onClick={handleOpenUserMenu} sx={{p: 1}}>
                                <PersonIcon color="secondary"/>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{mt: '45px'}}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            <MenuItem onClick={openProfilePage}>
                                <Typography textAlign="center">Account</Typography>
                            </MenuItem>
                            <MenuItem onClick={logOut}>
                                <Typography textAlign="center">Log out</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default ResponsiveAppBar;