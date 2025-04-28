import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FilterBar from "../components/Filterbar";
import EnhancedChart from "../components/EnhancedChart";
import { CSVLink } from "react-csv";
import axios from "axios";

const allColumns = [
  { key: "sno", label: "S No." },
  { key: "processName", label: "Process Name" },
  { key: "processOwner", label: "Process Owner" },
  { key: "jiraId", label: "Jira ID" },
  { key: "processType", label: "Process Type" },
  { key: "status", label: "Status" },
  { key: "volume", label: "Volume Processed" },
  { key: "successVolume", label: "Success Volume" },
  { key: "failedVolume", label: "Failed Volume" },
  { key: "startTime", label: "Start Time" },
  { key: "endTime", label: "End Time" },
  { key: "duration", label: "Duration" },
  { key: "output", label: "Output" },
];

function Dashboard() {
  const [filterOptions, setFilterOptions] = useState({ domains: [], usernames: [], processes: [] });
  const [filters, setFilters] = useState({ username: "", domain: "", processName: "" });
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((col) => col.key));
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const rowsPerPage = 10;

  const todayData = dashboardData.filter(item => item.date === new Date().toISOString().split("T")[0]);
  const monthlyData = dashboardData;

  const totalPages = Math.ceil(dashboardData.length / rowsPerPage);
  const currentData = dashboardData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await axios.get("/get_domains");
        setFilterOptions({
          domains: res.data.domain_names || [],
          usernames: res.data.usernames || [],
          processes: res.data.process_names || [],
        });
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/", { params: filters });
        setDashboardData(res.data.table_data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-auto">
        <Header />
        <div className="p-4 space-y-6">
          <FilterBar 
            filters={filters} 
            setFilters={setFilters}
            filterOptions={filterOptions}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnhancedChart title="Today's Trend" data={todayData} xAxisKey="hour" />
            <EnhancedChart title="Monthly Overview" data={monthlyData} xAxisKey="month" />
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-2 flex-wrap">
                {/* Copy Button */}
                <button
                  onClick={() => {
                    let text = visibleColumns
                      .map((key) => allColumns.find((col) => col.key === key).label)
                      .join("\t") + "\n";
                    currentData.forEach((row) => {
                      text += visibleColumns.map((key) => {
                        if (key === "startTime" || key === "endTime") {
                          return `${row.date} ${row[key]}`;
                        }
                        return row[key];
                      }).join("\t") + "\n";
                    });
                    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                >
                  Copy
                </button>

                {/* CSV Button */}
                <CSVLink
                  data={dashboardData.map((row) => {
                    const newRow = {};
                    visibleColumns.forEach((key) => {
                      newRow[key] = (key === "startTime" || key === "endTime")
                        ? `${row.date} ${row[key]}`
                        : row[key];
                    });
                    return newRow;
                  })}
                  filename="dashboard_data.csv"
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                >
                  CSV
                </CSVLink>

                {/* Excel Button */}
                <button
                  onClick={async () => {
                    const XLSX = await import("xlsx");
                    const ws = XLSX.utils.json_to_sheet(currentData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Data");
                    XLSX.writeFile(wb, "dashboard_data.xlsx");
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                >
                  Excel
                </button>

                {/* PDF Button */}
                <button
                  onClick={async () => {
                    const jsPDF = (await import("jspdf")).default;
                    const autoTable = (await import("jspdf-autotable")).default;
                    const doc = new jsPDF();
                    const headers = visibleColumns.map((key) =>
                      allColumns.find((col) => col.key === key).label
                    );
                    const body = currentData.map((row) =>
                      visibleColumns.map((key) => row[key])
                    );
                    autoTable(doc, { head: [headers], body });
                    doc.save("dashboard_data.pdf");
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                >
                  PDF
                </button>
              </div>

              {/* Column visibility */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm flex items-center"
                >
                  Column Visibility
                  <span className={`ml-2 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : "rotate-0"}`}>▼</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 bg-white border mt-1 shadow rounded z-10 max-h-60 overflow-y-auto w-48">
                    {allColumns.filter((col) => col.key !== "date").map((col) => (
                      <label key={col.key} className="block px-4 py-1 text-sm hover:bg-gray-100 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="mr-1"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto">
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading data...</div>
              ) : (
                <table className="min-w-full text-sm border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      {allColumns
                        .filter((col) => col.key !== "date" && visibleColumns.includes(col.key))
                        .map((col) => (
                          <th key={col.key} className="px-2 py-2 border border-gray-300 text-left">
                            {col.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((row, i) => (
                      <tr key={i} className="even:bg-gray-50">
                        {allColumns
                          .filter((col) => col.key !== "date" && visibleColumns.includes(col.key))
                          .map((col) => (
                            <td key={col.key} className="px-2 py-2 border border-gray-300">
                              {(col.key === "startTime" || col.key === "endTime")
                                ? `${row.date} ${row[col.key]}`
                                : row[col.key]}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-center items-center gap-2 text-sm flex-wrap">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`px-3 py-1 rounded ${
                    num === currentPage ? "bg-red-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
