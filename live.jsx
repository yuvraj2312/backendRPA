import React, { useRef, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const LivePage = () => {
  const tableRef = useRef(null);
  const calendarRef = useRef(null);

  const [data, setData] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [filters, setFilters] = useState({
    domain: "",
    goLiveRange: {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const [sidebarOpen, setSidebarOpen] = useState(true); // Manage sidebar state (open/collapsed)

  const fetchDomains = async () => {
    try {
      const res = await fetch("http://localhost:5000/get_domains");
      const json = await res.json();
      setDomains(json.domains1 || []);
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.domain) params.append("domain", filters.domain);
      const { startDate, endDate } = filters.goLiveRange;
      if (startDate && endDate) {
        params.append("startDate", startDate.toISOString().slice(0, 10));
        params.append("endDate", endDate.toISOString().slice(0, 10));
      }
      const res = await fetch(`http://localhost:5000/processlist?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      setData(await res.json());
      setCurrentPage(1); // reset to first page after filter search
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onClick = e => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    fetchDomains();
    fetchData();
  }, []);

  const handleInputChange = e => {
    setFilters(f => ({ ...f, domain: e.target.value }));
  };

  const handleSearch = () => fetchData();

  const handleCopy = () => {
    const text = data.map(r => Object.values(r).join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LiveData");
    XLSX.writeFile(wb, "LiveData.xlsx");
  };

  const handleExportCSV = () => {
    const rows = [
      ["Process Name","NLT Name","Domain","Process Owner","Stage","Go Live"],
      ...data.map(r => [r.process, r.nlt, r.domain, r.owner, r.stage, r.goLive])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "LiveData.csv";
    a.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Process Name","NLT Name","Domain","Process Owner","Stage","Go Live"]],
      body: data.map(r => [r.process, r.nlt, r.domain, r.owner, r.stage, r.goLive])
    });
    doc.save("LiveData.pdf");
  };

  // Pagination logic
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Fixed */}
      <div
        className={`fixed inset-y-0 left-0 transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-16'}`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <div className="p-6 overflow-auto">

          {/* Filters */}
          <div className="flex items-end gap-4 mb-6 flex-wrap">
            {/* Domain Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Domain <span className="text-red-500">*</span>
              </label>
              <select
                name="domain"
                value={filters.domain}
                onChange={handleInputChange}
                className="border rounded-md px-4 py-2 w-56"
              >
                <option value="">All Domains</option>
                {domains.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="relative" ref={calendarRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Go Live Range
              </label>
              <input
                readOnly
                placeholder="Select date range"
                value={
                  filters.goLiveRange.startDate && filters.goLiveRange.endDate
                    ? `${filters.goLiveRange.startDate.toLocaleDateString()} – ${filters.goLiveRange.endDate.toLocaleDateString()}`
                    : ""
                }
                className="border rounded-md px-4 py-2 w-64 cursor-pointer bg-white"
                onClick={() => setShowCalendar(s => !s)}
              />
              {showCalendar && (
                <div className="absolute z-50 mt-2 shadow-lg border rounded-md bg-white">
                  <DateRange
                    editableDateInputs
                    moveRangeOnFirstSelection={false}
                    ranges={[filters.goLiveRange]}
                    onChange={({ selection }) => {
                      setFilters(f => ({ ...f, goLiveRange: selection }));
                      setShowCalendar(false);
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            >
              Search
            </button>
          </div>

          {/* Exports */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className={`px-4 py-2 rounded transition ${copied ? "bg-blue-600 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600"}`}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={handleExportExcel} className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600">Excel</button>
              <button onClick={handleExportCSV}   className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">CSV</button>
              <button onClick={handleExportPDF}   className="bg-rose-400 text-white px-4 py-2 rounded hover:bg-rose-500">PDF</button>
            </div>
            <div className="text-lg font-semibold text-gray-700">
              Total: {data.length}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow text-base">
            {loading
              ? <div className="p-10 text-center">Loading…</div>
              : error
                ? <div className="p-10 text-center text-red-500">{error}</div>
                : paginatedData.length === 0
                  ? <div className="p-10 text-center">No data found</div>
                  : (
                    <>
                      <table className="min-w-full divide-y divide-gray-200 text-base text-left" ref={tableRef}>
                        <thead className="bg-red-500 text-white">
                          <tr>
                            {["Process Name","NLT Name","Domain","Process Owner","Stage","Go Live"].map((h,i) =>
                              <th key={i} className="px-8 py-6">{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedData.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-100">
                              <td className="px-8 py-6">{r.process}</td>
                              <td className="px-8 py-6">{r.nlt}</td>
                              <td className="px-8 py-6">{r.domain}</td>
                              <td className="px-8 py-6">{r.owner}</td>
                              <td className="px-8 py-6">{r.stage}</td>
                              <td className="px-8 py-6">{r.goLive}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      <div className="flex justify-center mt-6 space-x-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                          Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-red-500 text-white" : "bg-gray-200"}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;
