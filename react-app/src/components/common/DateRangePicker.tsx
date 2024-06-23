import {useEffect, useState} from 'react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {DateRange} from 'react-date-range';
import {useTheme} from "@mui/material";
import styled from 'styled-components';

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

const DateRangePicker = ({startDate, setStartDate, endDate, setEndDate}) => {
  const theme = useTheme();
  
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [secondClick, setSecondClick] = useState(false);
  
  useEffect(() => {
    setStart(startDate);
    setEnd(endDate);
  }, [startDate, endDate]);
  
  const handleDateChange = (dates) => {
    const {startDate, endDate} = dates;
    setStart(startDate);
    setEnd(endDate);
    if (secondClick) {
      setSecondClick(false);
      setStartDate(startDate);
      setEndDate(endDate);
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