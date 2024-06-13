import {useEffect, useState} from "react";
import {useTheme} from "@mui/material";
import {timeoutAbortSignal} from "../misc/utils";
import Plot from 'react-plotly.js';
import {tokens} from "../theme";
import {getAxiosClient} from "../misc/AxiosInstance";


interface SensorsDataPoint {
  time: string;       // "2024-04-01T18:34:45.743561Z"
  temperature: number;
  soil_moisture: number;
  water_level: number;
}

interface WateringDataPoint {
  time: string;
  duration: number;
}

// combine the data points into a single chart
const combinedChart = (sensorsData: SensorsDataPoint[],
                       wateringData: WateringDataPoint[],
                       endDate) => {
  const timeSeries: Date[] = sensorsData.map((dataPoint) => new Date(dataPoint.time));
  // wateringData.map((dataPoint) => {
  //   const date = new Date(dataPoint.time);
  //   const ms = date.getTime();
  //   const ms2 = ms + 1;
  //   const nextDate = new Date(ms2);
  //   timeSeries.push(date);
  //   timeSeries.push(nextDate);
  // });
  timeSeries.sort((a, b) => a.getTime() - b.getTime());
  const temperatureSeries = [];
  const soilMoistureSeries = [];
  const waterLevelSeries = [];
  const soilMoistureNormalized = [];
  // const wateringSeries = [];
  let skipFlag = false;
  timeSeries.map((time, i) => {
    if (sensorsData.some((dataPoint) => new Date(dataPoint.time).getTime() === time.getTime())) {
      const dataPoint = sensorsData.find((dataPoint) => new Date(dataPoint.time).getTime() === time.getTime());
      temperatureSeries.push(dataPoint.temperature);
      soilMoistureSeries.push(dataPoint.soil_moisture);
      waterLevelSeries.push(dataPoint.water_level);
      if (dataPoint.water_level <= 50)
        soilMoistureNormalized.push(dataPoint.soil_moisture);
      else
        soilMoistureNormalized.push(dataPoint.soil_moisture / dataPoint.water_level * 100);
    } else {
      temperatureSeries.push(null);
      soilMoistureSeries.push(null);
      waterLevelSeries.push(null);
      soilMoistureNormalized.push(null);
    }
    
    if (skipFlag) {
      skipFlag = false;
      return;
    }
    // if (wateringData.some((dataPoint) => new Date(dataPoint.time).getTime() === time.getTime())) {
    //   const dataPoint = wateringData.find((dataPoint) => new Date(dataPoint.time).getTime() === time.getTime());
    //   wateringSeries.push(0);
    //   wateringSeries.push(dataPoint.duration);
    //   skipFlag = true;
    // } else {
    //   wateringSeries.push(null);
    // }
  });
  
  // If the last data point is older than 20 minutes (and endDate is today), add empty data points to the end of the chart
  // to show if the device is offline
  const now = new Date();
  const timeDiff = 1000 * 60 * 20;
  if ( (now - timeSeries[timeSeries.length - 1] > timeDiff)
    && (now < endDate) ) {
    const lastDate = new Date(timeSeries[timeSeries.length - 1].getTime());
    while (lastDate < now - timeDiff) {
      lastDate.setMinutes(lastDate.getMinutes() + 15);
      timeSeries.push(new Date(lastDate));
      temperatureSeries.push(null);
      soilMoistureSeries.push(null);
      waterLevelSeries.push(null);
      soilMoistureNormalized.push(null);
      // wateringSeries.push(null);
    }
  }
  return {
    // timeline: timeSeries.map((time) => time.getTime()),
    timeline: timeSeries,
    temperatureSeries,
    soilMoistureSeries,
    waterLevelSeries,
    soilMoistureNormalized: soilMoistureNormalized,
    // wateringSeries,
  }
  
}

export const FarmChart = ({startDate, endDate}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const client = getAxiosClient();
  
  // const dispatch = useDispatch();
  // const stateLocal = useSelector((state) => state.dates);
  // const {startDateTS, endDateTS} = stateLocal;
  // const startDate = new Date(startDateTS);
  // const endDate = new Date(endDateTS);
  const [chartData, setChartData] = useState({
    timeline: [],
    temperatureSeries: [],
    soilMoistureSeries: [],
    waterLevelSeries: [],
    soilMoistureNormalized: [],
    // wateringSeries: []
  });
  let sensorsData: SensorsDataPoint[] = [];
  let wateringData: WateringDataPoint[] = [];
  
  useEffect(() => {
    // Get start of the day in unix time in the users timezone
    if (!startDate || !endDate) {//|| (prevEndDate === endDate)) {
      return;
    }
    const startDateCopy = new Date(startDate.getTime());
    startDateCopy.setHours(0, 0, 0, 0);
    const endDateCopy = new Date(endDate.getTime());
    endDateCopy.setHours(23, 59, 59, 999);
    const startDayTS_ = startDateCopy.getTime() * 1000000;   // ns precision in influx
    const endDayTS_ = endDateCopy.getTime() * 1000000;
    // Get chart data every minute
    const getData = setInterval(function _() {
      // Sensors data
      client.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/sensors/data?startTS=${startDayTS_}&endTS=${endDayTS_}`, {
        signal: timeoutAbortSignal(5000)
      })
      .then(r => {
        sensorsData = r.data;
        const thisDayEnd = new Date();
        thisDayEnd.setHours(23, 59, 59, 999);
        // if (
        //   prevEndDate === endDate    // dateRange has not changed
        //   && prevEndDate !== thisDayEnd   // but the next day has already started
        // ) {
        //   dispatch(changeDateRange({startDateTS: startDate.getTime(), endDateTS: thisDayEnd.getTime()}));
        // }
        
        // Watering data
        client.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/data?startTS=${startDayTS_}&endTS=${endDayTS_}`)
        .then(r => {
          wateringData = r.data;
          wateringData.length = 0;    // ==============================================
          const combined = combinedChart(sensorsData, wateringData, endDate);
          setChartData(combined);
        })
        .catch(e => {
            console.error(e);
          }
        );
      })
      .catch(e => {
        console.error(e);
      });
      return _;
    }(), 1000 * 60);
    // setPrevEndDate(endDate);
    return () => clearInterval(getData);
  }, [startDate, endDate]);
  
  const commonAxisLayout = {
    tickfont: {
      color: colors.grey[300]
    },
    gridcolor: colors.grey[800],
    zerolinecolor: colors.grey[700],
    titlefont: {
      color: theme.palette.text.primary
    }
  }
  
  const layout = {
    width: "100%",
    height: "40%",
    xaxis: {
      title: 'Time',
      // tickformat: '%Y-%m-%d %H:%M:%S',
      tickvals: chartData.timeline, // Use timeline as tick values
      ticktext: chartData.timeline.map((time, index) => {
        const currentHour = new Date(time).getHours();
        const previousHour = index > 0 ? new Date(chartData.timeline[index - 1]).getHours() : null;
        if (previousHour === null || currentHour !== previousHour) {
          // Display only hour if it changes
          return new Date(time).toLocaleTimeString([], {hour: '2-digit'});
        } else {
          // Display only minutes :15, :30, :45
          return ':' + new Date(time).toLocaleTimeString([], {minute: '2-digit'});
        }
      }),
      tickmode: 'auto',
      ...commonAxisLayout
    },
    yaxis: {
      title: 'Temperature',
      side: 'left',
      position: 0,
      fixedrange: true,
      ...commonAxisLayout,
    },
    yaxis2: {
      title: 'Soil Moisture',
      side: 'right',
      overlaying: 'y',
      position: 1,
      fixedrange: true,
      range: [0, 300],
      ...commonAxisLayout,
      gridcolor: colors.grey[200],
    },
    yaxis3: {
      title: 'Water Level',
      side: 'right',
      overlaying: 'y',
      position: 1,
      visible: false,
      fixedrange: true,
      range: [0, 400],
      ...commonAxisLayout,
    },
    yaxis4: {
      title: 'Soil Moisture %',
      side: 'right',
      overlaying: 'y',
      position: 1,
      visible: false,
    },
    legend: {
      x: 1.2,
      y: 1
    },
    hovermode: 'x unified',
    scrollZoom: true,
    plot_bgcolor: theme.palette.background.default,
    paper_bgcolor: theme.palette.background.default,
  };
  
  return (
    <Plot
      data={[
        {
          x: chartData.timeline,
          y: chartData.temperatureSeries,
          type: 'scatter',
          mode: 'lines',
          name: 'Temperature',
          yaxis: 'y',
          line: {color: 'orange'},
        },
        {
          x: chartData.timeline,
          y: chartData.soilMoistureSeries,
          type: 'scatter',
          mode: 'lines',
          name: 'Soil Moisture',
          yaxis: 'y2',
          line: {color: `rgba(0, 255, 0, 1)`},
        },
        {
          x: chartData.timeline,
          y: chartData.waterLevelSeries,
          type: 'scatter',
          mode: 'lines',
          name: 'Water Level',
          yaxis: 'y3',
          line: {color: 'blue'},
        },
        {
          x: chartData.timeline,
          y: chartData.soilMoistureNormalized,
          type: 'scatter',
          mode: 'lines',
          name: 'Soil Moisture Normalized',
          yaxis: 'y4',
          line: {color: 'green'},
        }
      ]}
      layout={layout}
    />
  );
}

export default FarmChart;