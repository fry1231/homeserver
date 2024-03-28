import {Box, Button, Typography} from '@mui/material';
import {purple} from '@mui/material/colors';
import {useNavigate} from 'react-router-dom';
import {useTheme} from "@mui/material";
import {tokens} from "../theme";

const primary = purple[500]; // #f44336

export default function NotFound() {
  const navigate = useNavigate()
  const theme = useTheme();
  const primary = tokens(theme.palette.main);
  const colors = tokens(theme.palette.mode);
  // const primary = colors.primary[500]
  
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
              onClick={() => navigate('/')} style={{marginTop: '20px'}}
      >Back Home</Button>
    </Box>
  );
}