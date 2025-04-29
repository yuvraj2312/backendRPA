import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const LandingPage = () => {
  const [filters, setFilters] = useState({
    username: '',
    domain: '',
    processname: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [dropdownOptions, setDropdownOptions] = useState({
    usernames1: [],
    domains1: [],
    processes1: []
  });

  const [tableData, setTableData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [barChartDataToday, setBarChartDataToday] = useState([]);
  const [barChartDataMonthly, setBarChartDataMonthly] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get('/get_domains', {
        params: {
          username: filters.username,
          domain: filters.domain,
          processname: filters.processname
        }
      });
      setDropdownOptions(res.data);
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const fetchMainData = async () => {
    try {
      const res = await axios.get('/');

      setTableData(res.data.data);
      setHeadings(res.data.headings);
      setSuccessCount(res.data.SuccessCount);
      setFailedCount(res.data.FailedCount);

      const labels = res.data.d_n || [];

      const todayChart = res.data.bardata1.map((val, idx) => ({
        label: labels[idx] || `Label ${idx + 1}`,
        Value: val[0]
      }));

      const monthlyChart = res.data.bardata2.map((val, idx) => ({
        label: labels[idx] || `Label ${idx + 1}`,
        Value: val[0]
      }));

      setBarChartDataToday(todayChart);
      setBarChartDataMonthly(monthlyChart);
    } catch (error) {
      console.error('Error fetching main data:', error);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchMainData();
  }, []);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchDropdowns();
    fetchMainData();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Header */}
        <Header />

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Same filter inputs as before */}
            {/** ... all 6 filters ... */}
            <div>
              <label className="block text-sm font-medium">NLT Name</label>
              <select
                name="username"
                value={filters.username}
                onChange={handleInputChange}
                className="w-full mt-1 border rounded px-2 py-1"
              >
                <option value="">All</option>
                {dropdownOptions.usernames1.map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Domain Name</label>
              <select
                name="domain"
                value={filters.domain}
                onChange={handleInputChange}
                className="w-full mt-1 border rounded px-2 py-1"
              >
                <option value="">All</option>
                {dropdownOptions.domains1.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Process Name</label>
              <select
                name="processname"
                value={filters.processname}
                onChange={handleInputChange}
                className="w-full mt-1 border rounded px-2 py-1"
              >
                <option value="">All</option>
                {dropdownOptions.processes1.map((proc) => (
                  <option key={proc} value={proc}>{proc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleInputChange}
                className="w-full mt-1 border rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleInputChange}
                className="w-full mt-1 border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleInputChange}
                className="w-full mt-1 border rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Search */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>

          {/* Bar Graphs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-4 rounded shadow h-64">
              <h2 className="text-lg font-semibold mb-2 text-center">Today Summary</h2>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={barChartDataToday}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Value" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-100 p-4 rounded shadow h-64">
              <h2 className="text-lg font-semibold mb-2 text-center">Monthly Summary</h2>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={barChartDataMonthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Value" fill="#2196F3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI Counts */}
          <div className="flex gap-6 mt-6">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded shadow">
              ✅ Success Count: {successCount}
            </div>
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded shadow">
              ❌ Failed Count: {failedCount}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-8">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-200 text-left">
                <tr>
                  {headings.map((head, index) => (
                    <th key={index} className="px-4 py-2 border">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-4 py-2 border">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
