import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LandingPage() {
  const [filters, setFilters] = useState({
    username: '',
    domain: '',
    processname: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [dropdowns, setDropdowns] = useState({
    usernames1: [],
    domains1: [],
    processes1: []
  });

  const [data, setData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [barDataToday, setBarDataToday] = useState({});
  const [barDataMonth, setBarDataMonth] = useState({});

  const fetchDropdowns = async () => {
    const res = await axios.get('/get_domains', {
      params: {
        username: filters.username,
        domain: filters.domain,
        processname: filters.processname
      }
    });
    setDropdowns(res.data);
  };

  const fetchMainData = async () => {
    const res = await axios.get('/');
    setData(res.data.data);
    setHeadings(res.data.headings);
    setBarDataToday({
      labels: res.data.l2,
      datasets: [
        {
          label: 'Volume Processed',
          data: res.data.bardata1[0],
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Success Volume',
          data: res.data.bardata1[1],
          backgroundColor: '#10b981'
        },
        {
          label: 'Failed Volume',
          data: res.data.bardata1[2],
          backgroundColor: '#ef4444'
        }
      ]
    });
    setBarDataMonth({
      labels: res.data.l3,
      datasets: [
        {
          label: 'Volume Processed',
          data: res.data.bardata2[0],
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Success Volume',
          data: res.data.bardata2[1],
          backgroundColor: '#10b981'
        },
        {
          label: 'Failed Volume',
          data: res.data.bardata2[2],
          backgroundColor: '#ef4444'
        }
      ]
    });
  };

  useEffect(() => {
    fetchDropdowns();
    fetchMainData();
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchDropdowns(); // optional, if you want updated dropdowns
    fetchMainData();  // implement filter passing in backend if needed
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">NLT Name</label>
          <select name="username" value={filters.username} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">All</option>
            {dropdowns.usernames1.map((u, i) => <option key={i} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Domain Name</label>
          <select name="domain" value={filters.domain} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">All</option>
            {dropdowns.domains1.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Process Name</label>
          <select name="processname" value={filters.processname} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">All</option>
            {dropdowns.processes1.map((p, i) => <option key={i} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select name="status" value={filters.status} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">All</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
      </div>

      <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Search
      </button>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Today's Performance</h2>
          <Bar data={barDataToday} />
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Monthly Performance</h2>
          <Bar data={barDataMonth} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-200 mt-6">
          <thead>
            <tr className="bg-gray-100">
              {headings.map((h, idx) => (
                <th key={idx} className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50">
                {row.map((val, cIdx) => (
                  <td key={cIdx} className="border border-gray-200 px-3 py-2 text-sm">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
