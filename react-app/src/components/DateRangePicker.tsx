import {useState} from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


const DateRangePicker = ({onChange}) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const handleDateChange = (dates) => {
    const [startDate, endDate] = dates;
    setStartDate(startDate);
    setEndDate(endDate);
    onChange && onChange(dates);
  };
  
  return (
    <DatePicker
      selected={startDate}
      onChange={handleDateChange}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      inline
    />
  );
};

export default DateRangePicker;