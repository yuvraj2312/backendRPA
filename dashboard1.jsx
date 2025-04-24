import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const token = 'your_token_here'; // Replace this with your actual token

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/?page=${currentPage}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDashboardData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const renderBarChart = () => {
    const barData = dashboardData?.bar?.labels.map((label, i) => ({
      hour: label,
      volume: dashboardData.bar.data[0][i],
      success: dashboardData.bar.data[1][i],
      failed: dashboardData.bar.data[2][i],
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="volume" fill="#8884d8" />
          <Bar dataKey="success" fill="#82ca9d" />
          <Bar dataKey="failed" fill="#ff6b6b" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    const lineData = dashboardData?.line?.labels.map((label, i) => ({
      month: label,
      volume: dashboardData.line.data[0][i],
      success: dashboardData.line.data[1][i],
      failed: dashboardData.line.data[2][i],
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="volume" stroke="#8884d8" />
          <Line type="monotone" dataKey="success" stroke="#82ca9d" />
          <Line type="monotone" dataKey="failed" stroke="#ff6b6b" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderTable = () => {
    if (!dashboardData || dashboardData.data.length === 0) return <p>No records found.</p>;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              {dashboardData.headings.map((heading, index) => (
                <th key={index} className="border px-4 py-2 text-left font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dashboardData.data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {row.map((cell, j) => (
                  <td key={j} className="border px-4 py-2">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = () => {
    const { current_page, total_pages } = dashboardData.pagination;

    return (
      <div className="flex justify-center mt-4 gap-3 items-center">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Prev
        </button>
        <span className="text-sm">Page {current_page} of {total_pages}</span>
        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={currentPage === total_pages}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) return <p className="text-center mt-8">Loading dashboard...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">RPA Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-green-100 text-green-800 p-4 rounded shadow">
          <p className="text-lg font-semibold">Success</p>
          <p className="text-2xl">{dashboardData.kpi.success}</p>
        </div>
        <div className="bg-red-100 text-red-800 p-4 rounded shadow">
          <p className="text-lg font-semibold">Failed</p>
          <p className="text-2xl">{dashboardData.kpi.fail}</p>
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Today's Volume</h2>
        {renderBarChart()}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Monthly Trend</h2>
        {renderLineChart()}
      </div>

      {/* Table */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Processes (Paginated)</h2>
        {renderTable()}
        {renderPagination()}
      </div>
    </div>
  );
};

export default Dashboard;
