import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const EnhancedChart = ({ barLabels, barData, lineLabels, lineData, kpis }) => {
  const combinedBarData = barLabels.map((label, idx) => ({
    name: label,
    Series1: barData[0]?.[idx] ?? 0,
    Series2: barData[1]?.[idx] ?? 0,
    Series3: barData[2]?.[idx] ?? 0,
  }));

  const combinedLineData = lineLabels.map((label, idx) => ({
    name: label,
    Series1: lineData[0]?.[idx] ?? 0,
    Series2: lineData[1]?.[idx] ?? 0,
    Series3: lineData[2]?.[idx] ?? 0,
  }));

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="p-4 shadow rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Bar Chart</h2>
        <BarChart width={500} height={300} data={combinedBarData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Series1" fill="#8884d8" />
          <Bar dataKey="Series2" fill="#82ca9d" />
          <Bar dataKey="Series3" fill="#ffc658" />
        </BarChart>
      </div>

      <div className="p-4 shadow rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Line Chart</h2>
        <LineChart width={500} height={300} data={combinedLineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Series1" stroke="#8884d8" />
          <Line type="monotone" dataKey="Series2" stroke="#82ca9d" />
          <Line type="monotone" dataKey="Series3" stroke="#ffc658" />
        </LineChart>
      </div>
    </div>
  );
};

export default EnhancedChart;
