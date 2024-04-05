import {BarChart, BarPlot} from '@mui/x-charts/BarChart'
import axios from "axios";
import {ChartContainer, ChartsLegend, ChartsXAxis, ChartsYAxis, LineChart, LinePlot} from "@mui/x-charts";
import {useEffect, useState} from "react";
import {Box} from "@mui/material";
import {useAuth} from "../misc/authProvider.jsx";
import {timeoutAbortSignal} from "../misc/utils";
import Plot from 'react-plotly.js';


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
const combinedChart = (sensorsData: SensorsDataPoint[], wateringData: WateringDataPoint[]) => {
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
  // const wateringSeries = [];
  let skipFlag = false;
  timeSeries.map((time, i) => {
    if (sensorsData.some((dataPoint) => new Date(dataPoint.time).getTime() === time.getTime())) {
      const dataPoint = sensorsData.find((dataPoint) => new Date(dataPoint.time).getTime() === time.getTime());
      temperatureSeries.push(dataPoint.temperature);
      soilMoistureSeries.push(dataPoint.soil_moisture);
      waterLevelSeries.push(dataPoint.water_level);
    } else {
      temperatureSeries.push(null);
      soilMoistureSeries.push(null);
      waterLevelSeries.push(null);
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
  console.log('timeSeries', timeSeries)
  console.log('first observation', timeSeries[0]);
  console.log('last observation', timeSeries[timeSeries.length - 1]);
  console.log('-2 observation', timeSeries[timeSeries.length - 2]);
  return {
    // timeline: timeSeries.map((time) => time.getTime()),
    timeline: timeSeries,
    temperatureSeries,
    soilMoistureSeries,
    waterLevelSeries,
    // wateringSeries,
  }
}

export const FarmChart = ({selectedDateRange}) => {
  const {token} = useAuth();
  const [chartData, setChartData] = useState({
    timeline: [],
    temperatureSeries: [],
    soilMoistureSeries: [],
    waterLevelSeries: [],
    // wateringSeries: []
  });
  useEffect(() => {
    // Get start of the day in unix time in the users timezone
    const {startDate, endDate} = selectedDateRange;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const startDayTS = Math.floor(startDate.getTime() / 1000);
    const endDayTS = Math.floor(endDate.getTime() / 1000);
    
    // Get chart data every minute
    const getData = setInterval(function _() {
      axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/sensors/data?startTS=${startDayTS}&endTS=${endDayTS}`, {
        signal: timeoutAbortSignal(5000)
      })
      .then(r => {
        const sensorsData: SensorsDataPoint[] = r.data;
        axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/data?startTS=${startDayTS}&endTS=${endDayTS}`)
        .then(r => {
          const wateringData: WateringDataPoint[] = r.data;
          wateringData.length = 0;    // ==============================================
          const combined = combinedChart(sensorsData, wateringData);
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
    return () => clearInterval(getData);
  }, [selectedDateRange]);
  
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
    },
    yaxis: {
      title: 'Temperature',
      side: 'left',
      position: 0,
      fixedrange: true,
    },
    yaxis2: {
      title: 'Soil Moisture',
      side: 'right',
      overlaying: 'y',
      position: 1,
      fixedrange: true,
    },
    yaxis3: {
      title: 'Water Level',
      side: 'right',
      overlaying: 'y',
      position: 0.85,
      visible: false,
      range: [0, 400],
    },
    legend: {
      x: 1.2,
      y: 1
    },
    hovermode: 'x unified',
    scrollZoom: true,
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
          line: {color: 'green'},
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
      ]}
      layout={layout}
    />
    // <Box sx={{ width: 500, height: 400 }}>
    //   <LineChart
    //     xAxis={[{ id: 'time', data: chartData.timeline, scaleType: 'linear',
    //       valueFormatter: (v) => new Date(v).toLocaleString()}]}
    //     yAxis={[
    //       { id: 'temperature', scaleType: 'linear', label: 'Temperature' },
    //       { id: 'soil_moisture', scaleType: 'linear', label: 'Soil Moisture'},
    //       { id: 'water_level', scaleType: 'linear' },
    //       // { id: 'watering_duration', scaleType: 'linear' }
    //     ]}
    //     series={chartData.series}
    //     leftAxis="temperature"
    //     rightAxis="soil_moisture"
    //     height={400}
    //     />
    // </Box>
  );
}

export default FarmChart;