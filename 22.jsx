import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
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

  const parseBarData = (rawData) => {
    if (!rawData || rawData.length < 3) return [];
    return [
      { label: 'Processed', value: rawData[0][0] },
      { label: 'Success', value: rawData[1][0] },
      { label: 'Failed', value: rawData[2][0] }
    ];
  };

  const fetchMainData = async () => {
    try {
      const res = await axios.get('/');
      setTableData(res.data.data);
      setHeadings(res.data.headings);
      setVisibleColumns(res.data.headings);
      setSuccessCount(res.data.SuccessCount);
      setFailedCount(res.data.FailedCount);
      setBarChartDataToday(parseBarData(res.data.bardata1));
      setBarChartDataMonthly(parseBarData(res.data.bardata2));
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

  const handleColumnToggle = (col) => {
    setVisibleColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const filteredHeadings = headings.filter(h => visibleColumns.includes(h));
  const filteredTableData = tableData.map(row =>
    row.filter((_, i) => visibleColumns.includes(headings[i]))
  );

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const currentRows = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const visibleCurrentRows = currentRows.map(row =>
    row.filter((_, i) => visibleColumns.includes(headings[i]))
  );

  const handleExportCSV = () => {
    const ws = XLSX.utils.aoa_to_sheet([filteredHeadings, ...filteredTableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'data.csv');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([filteredHeadings, ...filteredTableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'data.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [filteredHeadings],
      body: filteredTableData,
    });
    doc.save('data.pdf');
  };

  const handleCopy = () => {
    const text = [filteredHeadings, ...filteredTableData]
      .map(row => row.join('\t'))
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  return (
    <div className="p-6 space-y-8">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Filter Fields */}
        {/* Same as before... */}
      </div>

      <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Search
      </button>

      {/* Column Visibility */}
      <div className="mt-4">
        <label className="font-medium mr-2">Column Visibility:</label>
        <select
          multiple
          className="border rounded px-2 py-1"
          value={visibleColumns}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions, option => option.value);
            setVisibleColumns(options);
          }}
        >
          {headings.map((col, idx) => (
            <option key={idx} value={col}>{col}</option>
          ))}
        </select>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3 mt-4">
        <button onClick={handleCopy} className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">Copy</button>
        <button onClick={handleExportCSV} className="bg-green-300 px-3 py-1 rounded hover:bg-green-400">CSV</button>
        <button onClick={handleExportExcel} className="bg-blue-300 px-3 py-1 rounded hover:bg-blue-400">Excel</button>
        <button onClick={handleExportPDF} className="bg-red-300 px-3 py-1 rounded hover:bg-red-400">PDF</button>
      </div>

      {/* KPI Counts */}
      <div className="flex gap-6 mt-6">
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded shadow">✅ Success Count: {successCount}</div>
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded shadow">❌ Failed Count: {failedCount}</div>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded shadow h-64">
          <h2 className="text-lg font-semibold mb-2 text-center">Today Summary</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barChartDataToday}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4CAF50" />
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
              <Bar dataKey="value" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-8">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              {filteredHeadings.map((head, index) => (
                <th key={index} className="px-4 py-2 border">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleCurrentRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="px-4 py-2 border">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2">Prev</button>
          {[...Array(totalPages).keys()].slice(0, 10).map(num => (
            <button
              key={num + 1}
              onClick={() => setCurrentPage(num + 1)}
              className={`px-3 py-1 rounded ${currentPage === num + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {num + 1}
            </button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2">Next</button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;