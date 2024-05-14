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
      background-color: ${props => props.backgroundColor};
    }
`;

/**
 * Allows the user to select a date range using two of this component
 * @param date - the date to be set initially
 * @param setDate - the function to set the date
 * @param secondDate - the second date to be set initially (could be less than date)
 */
const DatePicker = ({date, setDate, secondDate, setSecondDate}) => {
  const theme = useTheme();
  const [previousRange, setPreviousRange] = useState([date, secondDate]);
  const isFirst = date.getTime() < secondDate.getTime();
  
  useEffect(() => {
    setPreviousRange([date, secondDate])
  }, [date, secondDate]);
  
  const handleDateChange = (dates) => {
    const {startDate, endDate} = dates;
    setPreviousRange([startDate, endDate]);
    // If startDate != any of the previous dates, set startDate
    // If endDate != any of the previous dates, set endDate
    let dateToSet;
    if (startDate.getTime() !== previousRange[0].getTime() && startDate.getTime() !== previousRange[1].getTime()) {
      dateToSet = startDate;
    } else {
      dateToSet = endDate;
    }
    // If selected date is not consistent with the datepicker position, choose one-day range
    if (isFirst && dateToSet.getTime() > secondDate.getTime()) {
      setSecondDate(dateToSet);
    }
    if (!isFirst && dateToSet.getTime() < secondDate.getTime()) {
      setSecondDate(dateToSet);
    }
    setDate(dateToSet);
  };

  return (
    <StyledWrapper
      backgroundColor={theme.palette.background.default}
      primaryTextColor={theme.palette.text.primary}
      disableTextColor={theme.palette.text.disabled}
      editableDateInputs={false}
      showDateDisplay={false}
      onChange={(range) => handleDateChange(range.selection)}
      ranges={[{startDate: date, endDate: secondDate, key: 'selection'}]}
    />
  );
};

export default DatePicker;