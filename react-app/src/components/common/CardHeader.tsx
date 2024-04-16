import {closeWindow} from "../../reducers/draggables";
import {tokens} from "../../theme";
import {Divider, useTheme} from "@mui/material";
import {Grid, IconButton, Typography} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {useDispatch} from "react-redux";

export const CardHeader = ({entityName, entityId, left, center}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const dispatch = useDispatch();
  
  return (
    <Grid className="handle" container justifyContent="space-between">
      <Grid item>
        <Typography display="inline" variant="body" component="h3">
          {left}
        </Typography>
      </Grid>
      <Grid item>
        <Typography ml={2} color={colors.greenAccent[400]}>
          {center}
        </Typography>
      </Grid>
      <Grid item>
        <IconButton onClick={() => dispatch(closeWindow({name: entityName, id: entityId}))}>
          <CloseIcon/>
        </IconButton>
      </Grid>
    </Grid>
  );
};