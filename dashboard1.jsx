import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar';
import EnhancedChart from './EnhancedChart';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [kpis, setKpis] = useState({ success: 0, fail: 0 });
  const [barData, setBarData] = useState({ labels: [], data: [[], [], []] });
  const [lineData, setLineData] = useState({ labels: [], data: [[], [], []] });
  const [dropdowns, setDropdowns] = useState({ process_names: [], usernames: [], domains: [] });
  const [filters, setFilters] = useState({ username: '', domain: '', process: '' });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, per_page: 20, total_records: 0 });

  const fetchData = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data, headings, kpi, bar, line, dropdowns, pagination } = res.data;
      setData(data);
      setHeadings(headings);
      setKpis(kpi);
      setBarData(bar);
      setLineData(line);
      setDropdowns(dropdowns);
      setPagination(pagination);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(row => Object.fromEntries(headings.map((h, i) => [h, row[i]]))));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Data');
    XLSX.writeFile(wb, 'dashboard_data.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [headings],
      body: data.map(row => row),
    });
    doc.save('dashboard_data.pdf');
  };

  const exportCopy = () => {
    const text = [headings.join(',')].concat(data.map(row => row.join(','))).join('\n');
    navigator.clipboard.writeText(text);
    alert('Data copied to clipboard!');
  };

  const filteredData = data.filter(row => {
    const matchesUser = filters.username ? row.includes(filters.username) : true;
    const matchesDomain = filters.domain ? row.includes(filters.domain) : true;
    const matchesProcess = filters.process ? row.includes(filters.process) : true;
    return matchesUser && matchesDomain && matchesProcess;
  });

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-4">
          <FilterBar
            processNames={dropdowns.process_names}
            usernames={dropdowns.usernames}
            domains={dropdowns.domains}
            onChange={handleFilterChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <EnhancedChart
              barLabels={barData.labels}
              barData={barData.data}
              lineLabels={lineData.labels}
              lineData={lineData.data}
              kpis={kpis}
            />
          </div>

          <div className="flex justify-end space-x-2 mb-2">
            <button className="btn" onClick={exportCopy}>Copy</button>
            <button className="btn" onClick={exportCSV}>Excel</button>
            <button className="btn" onClick={exportPDF}>PDF</button>
          </div>

          <div className="overflow-x-auto shadow rounded-lg">
            <table className="table-auto w-full text-left border-collapse">
              <thead>
                <tr>
                  {headings.map((heading, idx) => (
                    <th key={idx} className="px-4 py-2 bg-gray-100 border">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {row.map((cell, i) => (
                      <td key={i} className="border px-4 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              Page {pagination.current_page} of {pagination.total_pages}
            </div>
            <div className="space-x-2">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => fetchData(pagination.current_page - 1)}
                className="btn"
              >
                Previous
              </button>
              <button
                disabled={pagination.current_page === pagination.total_pages}
                onClick={() => fetchData(pagination.current_page + 1)}
                className="btn"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
