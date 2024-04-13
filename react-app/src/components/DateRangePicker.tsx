import {useState} from 'react';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import {DateRange} from 'react-date-range';
import {useTheme} from "@mui/material";
import {tokens} from "../theme";
import styled from 'styled-components';
import {changeDateRange} from "../reducers/dates";
import {useDispatch, useSelector} from "react-redux";

const StyledWrapper =
  styled(DateRange)`
    .rdrMonthAndYearWrapper, .rdrDateDisplayWrapper,
    .rdrMonth, .rdrNextButton, .rdrPprevButton, .rdrDateInput {
      background-color: ${props => props.backgroundColor};
    }
    
    .rdrDateDisplayWrapper * {
      color: ${props => props.primaryTextColor};
    }

    .rdrDayNumber span {
      color: ${props => props.primaryTextColor};
    }

    .rdrDayPassive span {
      color: ${props => props.disableTextColor};
    }

    .rdrMonthPicker select, .rdrYearPicker select {
      color: ${props => props.primaryTextColor};
    }
    `;

const DateRangePicker = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const stateLocal = useSelector((state) => state.dates);
  const {startDateTS, endDateTS} = stateLocal;
  const startDate = new Date(startDateTS);
  const endDate = new Date(endDateTS);
  
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [secondClick, setSecondClick] = useState(false);
  
  const handleDateChange = (dates) => {
    const {startDate, endDate} = dates;
    setStart(startDate);
    setEnd(endDate);
    if (secondClick) {
      setSecondClick(false);
      dispatch(changeDateRange({startDateTS: startDate.getTime(), endDateTS: endDate.getTime()}));
    } else {
      setSecondClick(true);
    }
  };

  return (
    <StyledWrapper
      backgroundColor={theme.palette.background.default}
      primaryTextColor={theme.palette.text.primary}
      disableTextColor={theme.palette.text.disabled}
      editableDateInputs={false}
      onChange={(range) => handleDateChange(range.selection)}
      moveRangeOnFirstSelection={false}    // Why does not work
      retainEndDateOnFirstSelection={false}
      ranges={[{
        startDate: start,
        endDate: end,
        key: 'selection',
      }]}
    />
  );
};

export default DateRangePicker;