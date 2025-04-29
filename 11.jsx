// Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FilterBar from "../components/Filterbar";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { CSVLink } from "react-csv";
import axios from "axios";

const allColumns = [
  { key: "sno", label: "S No." },
  { key: "process_name", label: "Process Name" },
  { key: "process_owner", label: "Process Owner" },
  { key: "jira_id", label: "Jira ID" },
  { key: "process_type", label: "Process Type" },
  { key: "status", label: "Status" },
  { key: "volume_processed", label: "Volume Processed" },
  { key: "success_volume", label: "Success Volume" },
  { key: "failed_volume", label: "Failed Volume" },
  { key: "start_time", label: "Start Time" },
  { key: "end_time", label: "End Time" },
  { key: "duration", label: "Duration" },
  { key: "output", label: "Output" },
];

function Dashboard() {
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map(col => col.key));
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [domains, setDomains] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const dropdownRef = useRef(null);
  const rowsPerPage = 10;

  useEffect(() => {
    axios.get("/get_domains")
      .then(res => setDomains(res.data))
      .catch(err => console.error("Failed to load domains", err));
  }, []);

  const fetchData = () => {
    axios.post("/", filters)
      .then(res => {
        setTableData(res.data.table_data);
        setChartData(res.data.chart_data);
      })
      .catch(err => console.error("Failed to fetch data", err));
  };

  const toggleColumn = key => {
    setVisibleColumns(prev => prev.includes(key)
      ? prev.filter(k => k !== key)
      : [...prev, key]);
  };

  const currentData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-auto">
        <Header />
        <div className="p-4 space-y-6">
          <FilterBar setFilters={setFilters} fetchData={fetchData} domains={domains} />

          <div className="bg-white p-6 rounded-2xl shadow-md w-full">
            <h2 className="text-2xl font-bold mb-4">Bot Execution Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Success" fill="#10B981" />
                <Bar dataKey="Failed" fill="#EF4444" />
                <Line dataKey="Total" stroke="#3B82F6" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between mb-2">
              <CSVLink
                data={tableData.map(row => {
                  const result = {};
                  visibleColumns.forEach(key => result[key] = row[key]);
                  return result;
                })}
                filename="dashboard_data.csv"
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Export CSV
              </CSVLink>
              <div className="relative">
                <button onClick={() => setDropdownOpen(prev => !prev)} className="bg-gray-200 px-3 py-1 rounded">
                  Column Visibility
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white border shadow-md rounded z-10 max-h-60 overflow-y-auto">
                    {allColumns.map(col => (
                      <label key={col.key} className="block px-4 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="mr-2"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  {visibleColumns.map(key => (
                    <th key={key} className="px-2 py-1 border border-gray-300">{allColumns.find(c => c.key === key)?.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, idx) => (
                  <tr key={idx} className="even:bg-gray-50">
                    {visibleColumns.map(key => (
                      <td key={key} className="px-2 py-1 border border-gray-300">{row[key]}</td>
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
}

export default Dashboard;

// FilterBar.jsx
import React from "react";

function FilterBar({ setFilters, fetchData, domains }) {
  const handleChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-4">
      <input
        type="text"
        name="nlt_name"
        placeholder="NLT Name"
        onChange={handleChange}
        className="border px-3 py-2 rounded"
      />
      <select name="domain" onChange={handleChange} className="border px-3 py-2 rounded">
        <option value="">Select Domain</option>
        {domains.map(domain => (
          <option key={domain} value={domain}>{domain}</option>
        ))}
      </select>
      <input
        type="text"
        name="process"
        placeholder="Process Name"
        onChange={handleChange}
        className="border px-3 py-2 rounded"
      />
      <button
        onClick={fetchData}
        className="bg-blue-600 text-white px-4 py-2 rounded col-span-1 md:col-span-3"
      >
        Apply Filters
      </button>
    </div>
  );
}

export default FilterBar;
