import {BarChart, BarPlot} from '@mui/x-charts/BarChart'
import axios from "axios";
import {ChartContainer, ChartsLegend, ChartsXAxis, ChartsYAxis, LineChart, LinePlot} from "@mui/x-charts";
import {useEffect, useState} from "react";
import {Box} from "@mui/material";
import {useAuth} from "../misc/authProvider.jsx";
import {timeoutAbortSignal} from "../misc/utils";

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
  wateringData.map((dataPoint) => {
    const date = new Date(dataPoint.time);
    const ms = date.getTime();
    const ms2 = ms + 1;
    const nextDate = new Date(ms2);
    timeSeries.push(date);
    timeSeries.push(nextDate);
  });
  timeSeries.sort();
  const temperatureSeries = [];
  const soilMoistureSeries = [];
  const waterLevelSeries = [];
  const wateringSeries = [];
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
  return {
    timeline: timeSeries.map((time) => time.getTime()),
    series: [
      {
        type: 'line',
        data: temperatureSeries,
        label: 't, °C',
        yAxisKey: 'temperature',
        color: 'orange'
      },
      {
        type: 'line',
        data: soilMoistureSeries,
        label: 'Soil Moisture',
        yAxisKey: 'soil_moisture',
        color: 'green'
      },
      {
        type: 'line',
        data: waterLevelSeries,
        label: 'Water Level',
        yAxisKey: 'water_level',
        color: 'blue'
      },
      // {
      //   type: 'line',
      //   data: wateringSeries,
      //   label: 'Watering',
      //   yAxisKey: 'watering_duration',
      //   color: 'purple',
      //   // width: 0.5
      // }
    ]
  }
}

export const FarmChart = () => {
  const {token} = useAuth();
  const [chartData, setChartData] = useState({
    timeline: [],
    series: []
  });
  useEffect(() => {
    // Get chart data every minute
    const getData = setInterval(function _() {
      axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/sensors/data`, {
        signal: timeoutAbortSignal(5000)
      })
      .then(r => {
        const sensorsData: SensorsDataPoint[] = r.data;
        axios.get(`https://${import.meta.env.VITE_REACT_APP_HOST}/farm/watering/data`)
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
  }, []);
  
  return (
    <Box sx={{ width: 500, height: 400 }}>
      <LineChart
        xAxis={[{ id: 'time', data: chartData.timeline, scaleType: 'linear',
          valueFormatter: (v) => new Date(v).toLocaleString()}]}
        yAxis={[
          { id: 'temperature', scaleType: 'linear', label: 'Temperature' },
          { id: 'soil_moisture', scaleType: 'linear', label: 'Soil Moisture'},
          { id: 'water_level', scaleType: 'linear' },
          // { id: 'watering_duration', scaleType: 'linear' }
        ]}
        series={chartData.series}
        leftAxis="temperature"
        rightAxis="soil_moisture"
        height={400}
        />
    </Box>
  );
}

export default FarmChart;