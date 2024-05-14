import {useEffect, useState} from 'react';
import Plot from 'react-plotly.js';
import {useQuery} from '@apollo/client';
import {GET_DAILY_STATISTICS_BETWEEN} from '../misc/gqlQueries';
import {LinearProgress, useTheme} from "@mui/material";
import {tokens} from "../theme";


interface DataPoint {
  afterDate: string;
  nNewUsers: number;
  nDeletedUsers: number;
  nActiveUsers: number;
  nSuperActiveUsers: number;
  nPaincases: number;
  nDruguses: number;
  nPressures: number;
}


const StatisticsChart = ({startDate, endDate}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const {loading, error, data} = useQuery(GET_DAILY_STATISTICS_BETWEEN, {
    variables: {
      afterDate: startDate.toISOString().split('T')[0],
      beforeDate: endDate.toISOString().split('T')[0],
    }
  });
  error && console.error(error);
  
  const plotData = [
    {name: 'New Users', dataKey: 'nNewUsers', yaxis: 'y'},
    {name: 'Deleted Users', dataKey: 'nDeletedUsers', yaxis: 'y'},
    {name: 'Active Users', dataKey: 'nActiveUsers', yaxis: 'y2'},
    {name: 'Super Active Users', dataKey: 'nSuperActiveUsers', yaxis: 'y2'},
    {name: 'Paincases', dataKey: 'nPaincases', yaxis: 'y'},
    {name: 'Druguses', dataKey: 'nDruguses', yaxis: 'y'},
    {name: 'Pressures', dataKey: 'nPressures', yaxis: 'y'},
  ].map(({name, dataKey, yaxis}) => ({
    x: data?.dailyStatistics.map((dataPoint: DataPoint) => new Date(dataPoint.afterDate)),
    y: data?.dailyStatistics.map((dataPoint: DataPoint) => dataPoint[dataKey]),
    type: 'scatter',
    name,
    yaxis,
  }));
  
  // Find the maximum value in each of the y series to set axis ranges
  const ySeries = plotData.filter(({yaxis}) => yaxis === 'y').map(({y}) => y);
  const y1maxVal = Math.max(...ySeries.reduce((a, b) => a.concat(b), []));
  const y2Series = plotData.filter(({yaxis}) => yaxis === 'y2').map(({y}) => y);
  const y2maxVal = Math.max(...y2Series.reduce((a, b) => a.concat(b), []));
  
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
      title: 'Date',
      tickformat: '%d.%m.%Y',
      showgrid: true,
      // zeroline: true,
      ...commonAxisLayout,
    },
    yaxis: {
      title: 'Count',
      side: 'left',
      showline: true,
      position: 0,
      range: [0, y1maxVal * 1.1],
      ...commonAxisLayout,
    },
    yaxis2: {
      title: 'N Active Users',
      side: 'right',
      position: 1,
      overlaying: 'y',
      showgrid: false,
      range: [0, y2maxVal * 1.1],
      ...commonAxisLayout,
    },
    legend: {
      // orientation: 'h',
      y: 0.8,
      x: 1.4,
      xanchor: 'center',
      yanchor: 'top',
    },
    hovermode: 'x unified',
    scrollZoom: true,
    plot_bgcolor: theme.palette.background.default,
    paper_bgcolor: theme.palette.background.default,
  };
  
  return (
    <>
      {
        loading
          ? <LinearProgress/>
          : null
      }
      <Plot
        data={plotData}
        layout={layout}
      />
    </>
  );
};

export default StatisticsChart;