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
import { CSVLink } from 'react-csv';
import { jsPDF } from 'jspdf';
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
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [barChartDataToday, setBarChartDataToday] = useState([]);
  const [barChartDataMonthly, setBarChartDataMonthly] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [visibleColumns, setVisibleColumns] = useState(headings);

  const fetchDropdowns = async () => {
    console.log('fetching dropdown options');
    try {
      const res = await axios.get('http://127.0.0.1:5000/get_domains', {
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
    console.log('fetching main data...');
    try {
      const res = await axios.get('http://127.0.0.1:5000/', {
        params: {
          username: filters.username,
          domain: filters.domain,
          processname: filters.processname,
          status: filters.status,
          start_date: filters.startDate,
          end_date: filters.endDate
        }
      });
      setTableData(res.data.data);
      setHeadings(res.data.headings);
      setSuccessCount(res.data.SuccessCount);
      setFailedCount(res.data.FailedCount);
      setCurrentPage(1);

      const todayChart = res.data.bardata1.map((val, idx) => ({
        label: `Today - Value ${idx + 1}`,
        Value: val[0]
      }));

      const monthlyChart = res.data.bardata2.map((val, idx) => ({
        label: `Month - Value ${idx + 1}`,
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

  const handleColumnVisibilityChange = (e) => {
    const column = e.target.name;
    setVisibleColumns((prevVisibleColumns) =>
      prevVisibleColumns.includes(column)
        ? prevVisibleColumns.filter((col) => col !== column)
        : [...prevVisibleColumns, column]
    );
  };

  const handleExportCSV = () => {
    // Prepare data for export
    const csvData = [headings, ...tableData];
    return csvData;
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([headings, ...tableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'table_data.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [headings],
      body: tableData,
    });
    doc.save('table_data.pdf');
  };

  const handleExportCopy = () => {
    const tableText = [headings, ...tableData]
      .map((row) => row.join('\t'))
      .join('\n');
    navigator.clipboard.writeText(tableText).then(() => {
      alert('Table copied to clipboard');
    });
  };

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = tableData.slice(startIndex, startIndex + rowsPerPage);

  const changePage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-4 space-x-2 items-center">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Prev
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => changePage(1)}
              className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => changePage(num)}
            className={`px-3 py-1 rounded border ${currentPage === num ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {num}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => changePage(totalPages)}
              className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonth = new Date().getMonth();
    return months[currentMonth];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto">
        <Header />
        <div className="p-6 space-y-8">
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">NLT Name</label>
              <select name="username" value={filters.username} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1">
                <option value="">All</option>
                {dropdownOptions.usernames1.map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Domain Name</label>
              <select name="domain" value={filters.domain} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1">
                <option value="">All</option>
                {dropdownOptions.domains1.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Process Name</label>
              <select name="processname" value={filters.processname} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1">
                <option value="">All</option>
                {dropdownOptions.processes1.map((proc) => (
                  <option key={proc} value={proc}>{proc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select name="status" value={filters.status} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1">
                <option value="">All</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1" />
            </div>
          </div>

          <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Search
          </button>

          {/* Bar Graphs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div>
              <h3 className="text-lg font-semibold">Today's Results</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartDataToday}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{getCurrentMonth()} Monthly Results</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartDataMonthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-8">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  {headings.map((heading, index) => {
                    return visibleColumns.includes(heading) ? (
                      <th key={index} className="px-4 py-2 text-sm font-semibold text-gray-700">
                        <div className="flex justify-between">
                          <span>{heading}</span>
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(heading)}
                            onChange={handleColumnVisibilityChange}
                            name={heading}
                          />
                        </div>
                      </th>
                    ) : null;
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {row.map((cell, cellIndex) => {
                      return visibleColumns.includes(headings[cellIndex]) ? (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-600">
                          {cell}
                        </td>
                      ) : null;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {renderPagination()}

          {/* Export Buttons */}
          <div className="mt-4">
            <button onClick={handleExportCopy} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
              Copy
            </button>
            <CSVLink data={handleExportCSV()} filename="table_data.csv">
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2">
                Export as CSV
              </button>
            </CSVLink>
            <button onClick={handleExportExcel} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2">
              Export as Excel
            </button>
            <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-2">
              Export as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
