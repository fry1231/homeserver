import {Box, Button, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useTheme} from "@mui/material";
import {tokens} from "../theme";


export default function NotFound() {
  const navigate = useNavigate()
  const theme = useTheme();
  const primary = tokens(theme.palette.main);
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: primary,
      }}
    >
      <Typography variant="h1" style={{color: colors.primary[300]}}>
        404
      </Typography>
      <Typography variant="h6" style={{color: colors.primary[300]}}>
        The page you’re looking for doesn’t exist.
      </Typography>
      <Button variant="contained"
              onClick={() => navigate(-1)}
              style={{marginTop: '20px'}}
      >Back Home</Button>
    </Box>
  );
}