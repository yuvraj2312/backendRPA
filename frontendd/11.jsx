import React, { useEffect, useState } from "react";
import { FilterBar } from "./FilterBar";
import { Sidebar } from "./Sidebar"; // your collapsible Sidebar
import { Header } from "./Header";   // your custom Header
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const ITEMS_PER_PAGE = 10;

export const LandingPage = () => {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [bardata1, setBardata1] = useState([]);
  const [bardata11, setBardata11] = useState(null);
  const [bardata22, setBardata22] = useState(null);
  const [dateLabel, setDateLabel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState([]);

  useEffect(() => {
    fetchData({});
  }, []);

  const fetchData = async (filterPayload) => {
    try {
      const response = await fetch("/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filterPayload),
      });
      const result = await response.json();
      setData(result.data || []);
      setHeadings(result.headings || []);
      setSuccessCount(result.SuccessCount);
      setFailedCount(result.FailedCount);
      setBardata1(result.bardata1 || []);
      setBardata11(result.bardata11 || null);
      setBardata22(result.bardata22 || null);
      setDateLabel(result.l2 ? result.l2[0] : "");
      setVisibleColumns(result.headings || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleFilterSearch = (filters) => {
    setFilters(filters);
    fetchData(filters);
    setCurrentPage(1);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [visibleColumns],
      body: currentPageData.map((row) =>
        visibleColumns.map((col) => row[col] || "")
      ),
    });
    doc.save("table_data.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      currentPageData.map((row) =>
        Object.fromEntries(visibleColumns.map((col) => [col, row[col]]))
      )
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Table Data");
    XLSX.writeFile(wb, "table_data.xlsx");
  };

  const copyToClipboard = () => {
    const text = [visibleColumns.join("\t")]
      .concat(
        currentPageData.map((row) =>
          visibleColumns.map((col) => row[col]).join("\t")
        )
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const currentPageData = data.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleColumn = (col) => {
    setVisibleColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  };

  const renderBarChart = (chartData, labels) => (
    <Bar
      data={{
        labels: labels,
        datasets: [
          {
            label: "Total",
            data: chartData[0],
            backgroundColor: "rgba(54, 162, 235, 0.6)",
          },
          {
            label: "Success",
            data: chartData[1],
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
          {
            label: "Failed",
            data: chartData[2],
            backgroundColor: "rgba(255, 99, 132, 0.6)",
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true } },
      }}
    />
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex flex-col flex-1 bg-gray-50">
        {/* Header */}
        <Header />

        <main className="p-6 overflow-y-auto space-y-6">
          {/* Filters */}
          <FilterBar onSearch={handleFilterSearch} />

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border-l-4 border-green-500 p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold text-green-700">Success</h3>
              <p className="text-2xl font-bold text-gray-700">{successCount}</p>
            </div>
            <div className="bg-white border-l-4 border-red-500 p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold text-red-700">Failed</h3>
              <p className="text-2xl font-bold text-gray-700">{failedCount}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-8 bg-white p-4 rounded-xl shadow">
            {bardata11 && bardata22 ? (
              <>
                {renderBarChart(bardata11.data, bardata11.labels)}
                {renderBarChart(bardata22.data, bardata22.labels)}
              </>
            ) : (
              bardata1.length > 0 && renderBarChart(bardata1, [dateLabel])
            )}
          </div>

          {/* Export + Column Controls */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Copy</button>
              <button onClick={exportExcel} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Excel</button>
              <button onClick={exportPDF} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">PDF</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Columns:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                onChange={(e) => toggleColumn(e.target.value)}
              >
                <option value="">Toggle Columns</option>
                {headings.map((col) => (
                  <option key={col} value={col}>
                    {visibleColumns.includes(col) ? "Hide" : "Show"} {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-xl shadow border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700 font-semibold">
                <tr>
                  {visibleColumns.map((col) => (
                    <th key={col} className="px-4 py-2 text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((row, idx) => (
                  <tr key={idx} className="even:bg-gray-50 hover:bg-gray-100 transition">
                    {visibleColumns.map((col) => (
                      <td key={col} className="px-4 py-2">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${currentPage === i + 1
                  ? "bg-blue-500 text-white"
                  : "border"
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
