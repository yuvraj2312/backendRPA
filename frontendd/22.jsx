import React, { useEffect, useState } from "react";
import { FilterBar } from "../components/Filterbar";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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
      const response = await fetch("http://127.0.0.1:5000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filterPayload),
      });
      const result = await response.json();

      const { headings = [], data = [] } = result;
      const formattedData = data.map((row) =>
        Object.fromEntries(headings.map((key, i) => [key, row[i]]))
      );

      setData(formattedData);
      setHeadings(headings);
      setVisibleColumns(headings);
      setSuccessCount(result.SuccessCount);
      setFailedCount(result.FailedCount);
      setBardata1(result.bardata1 || []);
      setBardata11(result.bardata11 || null);
      setBardata22(result.bardata22 || null);
      setDateLabel(result.l2 ? result.l2[0] : "");
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
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />

        <main className="p-6 space-y-8 overflow-y-auto bg-gray-50 min-h-screen">
          <FilterBar onSearch={handleFilterSearch} />

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border-l-4 border-green-500 shadow">
              <h3 className="text-md font-semibold text-green-700">Success</h3>
              <p className="text-3xl font-bold text-gray-800">{successCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-l-4 border-red-500 shadow">
              <h3 className="text-md font-semibold text-red-700">Failed</h3>
              <p className="text-3xl font-bold text-gray-800">{failedCount}</p>
            </div>
          </div>

          {/* Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bardata11 && bardata22 ? (
              <>
                <div className="bg-white p-4 rounded-xl shadow">{renderBarChart(bardata11.data, bardata11.labels)}</div>
                <div className="bg-white p-4 rounded-xl shadow">{renderBarChart(bardata22.data, bardata22.labels)}</div>
              </>
            ) : (
              bardata1.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow col-span-2">
                  {renderBarChart(bardata1, [dateLabel])}
                </div>
              )
            )}
          </div>

          {/* Export and Column Controls */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow">Copy</button>
              <button onClick={exportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow">Excel</button>
              <button onClick={exportPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow">PDF</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Columns:</label>
              <select
                onChange={(e) => toggleColumn(e.target.value)}
                className="border rounded px-3 py-1 text-sm bg-white"
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
          <div className="overflow-auto rounded-xl shadow border bg-white max-w-full">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {visibleColumns.map((col) => (
                    <th key={col} className="px-4 py-2 text-left font-medium text-gray-700">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((row, idx) => (
                  <tr key={idx} className="even:bg-gray-50 hover:bg-blue-50 transition">
                    {visibleColumns.map((col) => (
                      <td key={col} className="px-4 py-2 whitespace-nowrap">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "border"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
