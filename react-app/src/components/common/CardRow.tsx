import {tokens} from "../../theme";
import {Typography, useTheme} from "@mui/material";

export const CardRow = ({left, right}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <>
      <Typography color={colors.grey[300]} display="inline" variant="body2" component="p">
        {left}:
      </Typography>
      <Typography ml={1} display="inline" variant="body2" component="p">
        {right}
      </Typography>
      <br />
    </>
  );
};