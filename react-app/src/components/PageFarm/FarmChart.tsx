import {useEffect, useState} from "react";
import {useTheme} from "@mui/material";
import Plot from 'react-plotly.js';
import {tokens} from "../../theme";
import axios from "../../misc/AxiosInstance";


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
  console.log(wateringData);
  const timeSeries: Date[] = sensorsData.map((dataPoint: SensorsDataPoint) => new Date(dataPoint.time));
  
  // Add watering data points to the time series
  // Also add two extra points before and after each watering data point to make the chart look better
  wateringData.map((dataPoint: WateringDataPoint) => {
    const p2 = new Date(dataPoint.time);
    const ms = p2.getTime();
    const ms1 = ms - 1;
    const ms3 = ms + 1;
    const p1 = new Date(ms1);
    const p3 = new Date(ms3);
    timeSeries.push(p1, p2, p3);
  });
  timeSeries.sort((a: Date, b: Date) => a.getTime() - b.getTime());
  
  // Fill the time series with data points
  const temperatureSeries: number[] = [];
  const soilMoistureSeries: number[] = [];
  const waterLevelSeries: number[] = [];
  const soilMoistureNormalized: number[] = [];
  const wateringSeries: number[] = [];
  
  let prevTemp = 0;
  let prevSoil = 0;
  let prevWater = 0;
  let prevSoilNormalized = 0;
  
  timeSeries.map((time: Date) => {
    // Add sensors data points to the time series if they exist, otherwise push null
    if (sensorsData.some((dataPoint: SensorsDataPoint) => new Date(dataPoint.time).getTime() === time.getTime())) {
      const dataPoint = sensorsData.find((dataPoint: SensorsDataPoint) => new Date(dataPoint.time).getTime() === time.getTime());
      temperatureSeries.push(dataPoint.temperature);
      soilMoistureSeries.push(dataPoint.soil_moisture);
      waterLevelSeries.push(dataPoint.water_level);
      let soilMoistureNormalizedValue = prevSoilNormalized;
      if (dataPoint.water_level <= 50)
        soilMoistureNormalizedValue = dataPoint.soil_moisture;
      else
        soilMoistureNormalizedValue = dataPoint.soil_moisture / dataPoint.water_level * 100;
      soilMoistureNormalized.push(soilMoistureNormalizedValue);
      
      // For filling the gaps when watering data points are inserted, so no gaps are visible
      prevTemp = dataPoint.temperature;
      prevSoil = dataPoint.soil_moisture;
      prevWater = dataPoint.water_level;
      prevSoilNormalized = soilMoistureNormalizedValue;
    } else {
      temperatureSeries.push(prevTemp);
      soilMoistureSeries.push(prevSoil);
      waterLevelSeries.push(prevWater);
      soilMoistureNormalized.push(prevSoilNormalized);
    }
    
    // Add watering data points with value=100 to the time series if they exist, otherwise push 0
    if (wateringData.some((dataPoint: WateringDataPoint) => new Date(dataPoint.time).getTime() === time.getTime())) {
      wateringSeries.push(100);
    } else {
      wateringSeries.push(0);
    }
  });
  console.log(wateringSeries)
  // If the last data point is older than 20 minutes (and endDate is today), add empty data points to the end of the chart
  // to show that the device is offline
  const now = new Date();
  const timeDiff = 1000 * 60 * 20;
  if ((now - timeSeries[timeSeries.length - 1] > timeDiff)
    && (now < endDate)) {
    const lastDate = new Date(timeSeries[timeSeries.length - 1].getTime());
    while (lastDate < now - timeDiff) {
      lastDate.setMinutes(lastDate.getMinutes() + 15);
      timeSeries.push(new Date(lastDate));
      temperatureSeries.push(null);
      soilMoistureSeries.push(null);
      waterLevelSeries.push(null);
      soilMoistureNormalized.push(null);
      wateringSeries.push(null);
    }
  }
  return {
    timeline: timeSeries,
    temperatureSeries,
    soilMoistureSeries,
    waterLevelSeries,
    soilMoistureNormalized: soilMoistureNormalized,
    wateringSeries,
  }
}


export const FarmChart = ({startDate, endDate}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [chartData, setChartData] = useState({
    timeline: [],
    temperatureSeries: [],
    soilMoistureSeries: [],
    waterLevelSeries: [],
    soilMoistureNormalized: [],
    wateringSeries: []
  });
  let sensorsData: SensorsDataPoint[] = [];
  let wateringData: WateringDataPoint[] = [];
  
  useEffect(() => {
    if (!startDate || !endDate) {//|| (prevEndDate === endDate)) {
      return;
    }
    // Get start of the day in unix time in the users timezone
    const startDateCopy = new Date(startDate.getTime());
    startDateCopy.setHours(0, 0, 0, 0);
    const endDateCopy = new Date(endDate.getTime());
    endDateCopy.setHours(23, 59, 59, 999);
    const startDayTS_ = startDateCopy.getTime() * 1000000;   // nanosec precision in influx
    const endDayTS_ = endDateCopy.getTime() * 1000000;
    // Get chart data every minute
    const getData = setInterval(function _() {
      // Sensors data
      axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/sensors/data?startTS=${startDayTS_}&endTS=${endDayTS_}`)
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
        axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/data?startTS=${startDayTS_}&endTS=${endDayTS_}`)
        .then(r => {
          wateringData = r.data;
          // wateringData.length = 0;    // ==============================================
          const combined = combinedChart(sensorsData, wateringData, endDate);
          setChartData(combined);
        });
      })
      return _;
    }(), 1000 * 60);
    // setPrevEndDate(endDate);
    return () => clearInterval(getData);
  }, [startDate, endDate]);
  
  const commonAxisLayout = {
    tickfont: {
      color: colors.grey[300]
    },
    gridcolor: colors.grey[700],
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
      gridcolor: colors.greenAccent[700],
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
      title: 'Watering',
      side: 'right',
      overlaying: 'y',
      position: 1,
      visible: false,
      fixedrange: true,
      range: [1, 100],
      hoverformat: '',
      ...commonAxisLayout,
    },
    // yaxis5: {
    //   title: 'Soil Moisture %',
    //   side: 'right',
    //   overlaying: 'y',
    //   position: 1,
    //   visible: false,
    // },
    
    legend: {
      x: 0,
      xanchor: 'left',
      y: 1,
      font: {
        color: theme.palette.text.primary
      }
    },
  
    hoverlabel: {bgcolor: colors.grey[800]},
    
    hovermode: 'x unified',
    scrollZoom: true,
    plot_bgcolor: 'rgba(0, 0, 0, 0.0)',
    paper_bgcolor: 'rgba(0, 0, 0, 0.0)',
    autosize: true,
  };
  
  return (
    <Plot
      // key={plotKey}
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
          y: chartData.wateringSeries,
          type: 'scatter',
          mode: 'lines',
          name: 'Watering',
          yaxis: 'y4',
          line: {color: `rgba(255,91,91,0.42)`},
        },
        // {
        //   x: chartData.timeline,
        //   y: chartData.soilMoistureNormalized,
        //   type: 'scatter',
        //   mode: 'lines',
        //   name: 'Soil Moisture Normalized',
        //   yaxis: 'y4',
        //   line: {color: 'green'},
        // }
      ]}
      layout={layout}
      config={{responsive: true}}
      useResizeHandler
    />
  );
}

export default FarmChart;