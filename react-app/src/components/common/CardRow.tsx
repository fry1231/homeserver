import {tokens} from "../../theme";
import {Link, Typography, useTheme} from "@mui/material";


export const CardRow = ({left, right, onClickHandler}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <>
      <Typography mr={1} color={colors.grey[300]} display="inline" variant="body2" component="p">
        {left}{(left === "") || (right === "") ? "" : ":"}
      </Typography>
      {
      onClickHandler
        ? <Link component="button" variant="body2" color="inherit"
                onClick={onClickHandler}>
          {right}
          </Link>
        : <Typography display="inline" variant="body2" component="p">
          {right}
          </Typography>
      }
      <br />
    </>
  );
};