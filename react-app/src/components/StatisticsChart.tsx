import {useEffect, useState} from 'react';
import Plot from 'react-plotly.js';
import {useQuery} from '@apollo/client';
import {GET_DAILY_STATISTICS_BETWEEN, GET_SUM_STATISTICS_BETWEEN} from '../misc/gqlQueries';


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


const StatisticsChart = () => {
  const {loading, error, data} = useQuery(GET_DAILY_STATISTICS_BETWEEN, {
    variables: {
      afterDate: new Date('2024-03-01').toISOString().split('T')[0],
      beforeDate: new Date('2023-03-31').toISOString().split('T')[0],
    }
  });
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;
  
  const plotData = Object.keys(data.statistics).map(key => {
    if (key !== 'afterDate') {
      return {
        x: data.statistics.map(item => item.afterDate),
        y: data.statistics.map(item => item[key]),
        type: 'scatter',
        mode: 'lines+markers',
        name: key,
      };
    }
    return null;
  }).filter(Boolean);
  
  const layout = {
    title: 'App Statistics',
    xaxis: {
      title: 'Date',
      showgrid: true,
      zeroline: true,
    },
    yaxis: {
      title: 'Count',
      showline: true,
    },
  };
  z
  return (
    <Plot
      data={plotData}
      layout={layout}
    />
  );
};

export default StatisticsChart;