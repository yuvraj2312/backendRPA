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
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchDomains = async () => {
    try {
      const response = await fetch("/get_domains");
      const result = await response.json();

      const uniqueDomains = [
        ...new Set(result.map((item) => item.domain)),
      ].filter(Boolean); // remove empty/null domains
      setDomains(uniqueDomains);
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.domain) {
        params.append("domain", filters.domain);
      }
      if (filters.goLiveRange.startDate && filters.goLiveRange.endDate) {
        params.append(
          "startDate",
          filters.goLiveRange.startDate.toLocaleDateString("en-US")
        );
        params.append(
          "endDate",
          filters.goLiveRange.endDate.toLocaleDateString("en-US")
        );
      }

      const response = await fetch(`/processlist?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleCopy = () => {
    const text = data.map((row) => Object.values(row).join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LiveData");
    XLSX.writeFile(workbook, "LiveData.xlsx");
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["Process Name", "NLT Name", "Domain", "Process Owner", "Stage", "Go Live Date"],
      ...data.map((row) => [
        row.process,
        row.nlt,
        row.domain,
        row.owner,
        row.stage,
        row.goLive,
      ]),
    ];
    const csvContent = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "LiveData.csv";
    a.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Process Name", "NLT Name", "Domain", "Process Owner", "Stage", "Go Live Date"]],
      body: data.map((row) => [
        row.process,
        row.nlt,
        row.domain,
        row.owner,
        row.stage,
        row.goLive,
      ]),
    });
    doc.save("LiveData.pdf");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDomains();
    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <div className="p-6">

          {/* Search Filters */}
          <div className="flex items-end flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Domain Name <span className="text-red-500">*</span>
              </label>
              <select
                name="domain"
                value={filters.domain}
                onChange={handleInputChange}
                className="border rounded-md px-4 py-2 w-56"
              >
                <option value="">Select Domain</option>
                {domains.map((domain, idx) => (
                  <option key={idx} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative" ref={calendarRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Go Live Date Range <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                readOnly
                className="border rounded-md px-4 py-2 w-64 bg-white cursor-pointer"
                value={`${filters.goLiveRange.startDate.toLocaleDateString()} - ${filters.goLiveRange.endDate.toLocaleDateString()}`}
                onClick={() => setShowCalendar((prev) => !prev)}
              />
              {showCalendar && (
                <div className="absolute z-50 mt-2 shadow-lg border rounded-md bg-white">
                  <DateRange
                    editableDateInputs={true}
                    onChange={(ranges) => {
                      setFilters((prev) => ({ ...prev, goLiveRange: ranges.selection }));
                      setShowCalendar(false);
                    }}
                    moveRangeOnFirstSelection={false}
                    ranges={[filters.goLiveRange]}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-700 transition"
            >
              Search
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex justify-between items-center flex-wrap mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  copied ? "bg-blue-600 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={handleExportExcel} className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600">
                Excel
              </button>
              <button onClick={handleExportCSV} className="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-slate-600">
                CSV
              </button>
              <button onClick={handleExportPDF} className="bg-rose-400 text-white px-4 py-2 rounded-md hover:bg-rose-500">
                PDF
              </button>
            </div>
            <div className="ml-auto text-lg font-semibold text-gray-700">
              Total Live Processes: {data.length}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            {loading ? (
              <div className="text-center p-10 font-semibold text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-center p-10 text-red-500 font-semibold">{error}</div>
            ) : data.length === 0 ? (
              <div className="text-center p-10 font-semibold text-gray-500">No Data Found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left" ref={tableRef}>
                <thead className="bg-red-500 text-white">
                  <tr>
                    <th className="px-6 py-3">Process Name</th>
                    <th className="px-6 py-3">NLT Name</th>
                    <th className="px-6 py-3">Domain</th>
                    <th className="px-6 py-3">Process Owner</th>
                    <th className="px-6 py-3">Automation Stage</th>
                    <th className="px-6 py-3">Go Live Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-100">
                      <td className="px-6 py-4">{item.process}</td>
                      <td className="px-6 py-4">{item.nlt}</td>
                      <td className="px-6 py-4">{item.domain}</td>
                      <td className="px-6 py-4">{item.owner}</td>
                      <td className="px-6 py-4">{item.stage}</td>
                      <td className="px-6 py-4">{item.goLive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;
