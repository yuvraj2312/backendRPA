import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTable, usePagination, useFilters, useGlobalFilter, useColumnOrder } from 'react-table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LandingPage = () => {
  const [filters, setFilters] = useState({
    username: '', domain: '', processname: '', status: '', startDate: '', endDate: ''
  });

  const [dropdownOptions, setDropdownOptions] = useState({
    usernames1: [], domains1: [], processes1: []
  });

  const [tableData, setTableData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [barChartDataToday, setBarChartDataToday] = useState([]);
  const [barChartDataMonthly, setBarChartDataMonthly] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get('/get_domains', { params: filters });
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
      setSuccessCount(res.data.SuccessCount);
      setFailedCount(res.data.FailedCount);
      setBarChartDataToday(parseBarData(res.data.bardata1));
      setBarChartDataMonthly(parseBarData(res.data.bardata2));
      setVisibleColumns(res.data.headings);
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

  const columns = useMemo(() => visibleColumns.map((col, i) => ({
    Header: col,
    accessor: (row) => row[i],
    id: `col-${i}`
  })), [visibleColumns, tableData]);

  const data = useMemo(() => tableData, [tableData]);

  const {
    getTableProps, getTableBodyProps, headerGroups, page, prepareRow,
    nextPage, previousPage, canNextPage, canPreviousPage, pageOptions,
    gotoPage, setPageSize, state: { pageIndex }
  } = useTable({ columns, data, initialState: { pageSize: 10 } }, usePagination);

  const handleExport = (type) => {
    const exportData = tableData.map(row =>
      visibleColumns.map((_, index) => row[index])
    );

    if (type === 'copy') {
      const text = [visibleColumns.join('\t'), ...exportData.map(row => row.join('\t'))].join('\n');
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } else if (type === 'csv' || type === 'excel') {
      const worksheet = utils.aoa_to_sheet([visibleColumns, ...exportData]);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      writeFile(workbook, `table_data.${type === 'csv' ? 'csv' : 'xlsx'}`);
    } else if (type === 'pdf') {
      const doc = new jsPDF();
      autoTable(doc, {
        head: [visibleColumns],
        body: exportData,
      });
      doc.save('table_data.pdf');
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Filter Inputs */}
        {['username', 'domain', 'processname', 'status', 'startDate', 'endDate'].map((name, idx) => (
          <div key={idx}>
            <label className="block text-sm font-medium">
              {name === 'username' ? 'NLT Name' : name === 'processname' ? 'Process Name' : name === 'startDate' ? 'Start Date' : name === 'endDate' ? 'End Date' : name.charAt(0).toUpperCase() + name.slice(1)}
            </label>
            {name === 'startDate' || name === 'endDate' ? (
              <input type="date" name={name} value={filters[name]} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1" />
            ) : (
              <select name={name} value={filters[name]} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1">
                <option value="">All</option>
                {(name === 'username' ? dropdownOptions.usernames1 : name === 'domain' ? dropdownOptions.domains1 : name === 'processname' ? dropdownOptions.processes1 : ['Success', 'Failed']).map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[{ title: 'Today Summary', data: barChartDataToday, color: '#4CAF50' }, { title: 'Monthly Summary', data: barChartDataMonthly, color: '#2196F3' }].map((chart, i) => (
          <div key={i} className="bg-gray-100 p-4 rounded shadow h-64">
            <h2 className="text-lg font-semibold mb-2 text-center">{chart.title}</h2>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={chart.color} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* KPI Counts */}
      <div className="flex gap-6 mt-6">
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded shadow">✅ Success Count: {successCount}</div>
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded shadow">❌ Failed Count: {failedCount}</div>
      </div>

      {/* Column Visibility */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <span className="font-medium">Show Columns:</span>
        {headings.map((head, i) => (
          <label key={i} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={visibleColumns.includes(head)}
              onChange={() => {
                setVisibleColumns((prev) =>
                  prev.includes(head) ? prev.filter(h => h !== head) : [...prev, head]
                );
              }}
            />
            {head}
          </label>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="mt-4 flex gap-4">
        <button onClick={() => handleExport('copy')} className="bg-gray-500 text-white px-3 py-1 rounded">Copy</button>
        <button onClick={() => handleExport('csv')} className="bg-green-600 text-white px-3 py-1 rounded">CSV</button>
        <button onClick={() => handleExport('excel')} className="bg-yellow-500 text-white px-3 py-1 rounded">Excel</button>
        <button onClick={() => handleExport('pdf')} className="bg-red-500 text-white px-3 py-1 rounded">PDF</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4 border rounded shadow">
        <table {...getTableProps()} className="min-w-full text-sm">
          <thead className="bg-gray-200">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} className="px-4 py-2 border text-left">{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="hover:bg-gray-50">
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-4 py-2 border">{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
        {pageOptions.slice(0, 10).map((pg, i) => (
          <button key={i} onClick={() => gotoPage(pg)} className={`px-3 py-1 rounded ${pg === pageIndex ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{pg + 1}</button>
        ))}
        <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default LandingPage;
